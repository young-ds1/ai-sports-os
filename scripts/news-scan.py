#!/usr/bin/env python3
"""
News Scanner — helps discover 小道消息 by keyword-scanning news sources.
Does NOT replace human judgment. Outputs suggested events for manual review.

Usage:
    python3 scripts/news-scan.py                    # Scan all 44 teams
    python3 scripts/news-scan.py --team England     # Single team deep scan
    python3 scripts/news-scan.py --high-risk        # Only high/medium risk teams
    python3 scripts/news-scan.py --suggest          # Generate event suggestions
"""

import json, sys, os, re, subprocess
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# Risk profiles + keywords from news-watchlist.json
DEFAULT_RISK = 'low'

KEYWORDS_NEGATIVE_HIGH = ['内讧', '冲突', '罢训', '架空', '更衣室分裂', '拒绝出场',
                          '夜店', '醉酒', '打架', '斗殴', '受伤退出', '临时离队',
                          'mutiny', 'bust-up', 'dressing room', 'refused to play',
                          'nightclub', 'fight', 'training ground', 'fall out']
KEYWORDS_NEGATIVE_MED = ['批评', '不满', '争吵', '迟到', '丢失', '食物中毒',
                         '失眠', '延误', 'criticism', 'unhappy', 'argument',
                         'late', 'missing', 'delay']
KEYWORDS_POSITIVE = ['状态火热', '团结', '表现出色', '复出', '回归', '连胜',
                     'on fire', 'united', 'return', 'confident']

SEARCH_URLS = {
    'hupu': 'https://www.hupu.com/',
    'zhibo8': 'https://www.zhibo8.cc/',
    'reddit_soccer': 'https://www.reddit.com/r/soccer/search.json?q=',
}

TEAM_SEARCH_TERMS_CN = {
    'Argentina': '阿根廷', 'Brazil': '巴西', 'France': '法国', 'England': '英格兰',
    'Spain': '西班牙', 'Germany': '德国', 'Portugal': '葡萄牙', 'Netherlands': '荷兰',
    'Belgium': '比利时', 'Croatia': '克罗地亚', 'Uruguay': '乌拉圭', 'Colombia': '哥伦比亚',
    'USA': '美国', 'Mexico': '墨西哥', 'Norway': '挪威', 'Sweden': '瑞典',
    'Japan': '日本', 'South Korea': '韩国', 'Australia': '澳大利亚',
    'Senegal': '塞内加尔', 'Morocco': '摩洛哥', 'Ghana': '加纳', 'Ivory Coast': '科特迪瓦',
    'Egypt': '埃及', 'Tunisia': '突尼斯', 'Algeria': '阿尔及利亚',
    'Iran': '伊朗', 'Saudi Arabia': '沙特', 'Qatar': '卡塔尔', 'Iraq': '伊拉克',
    'Canada': '加拿大', 'Scotland': '苏格兰', 'Turkey': '土耳其',
    'Switzerland': '瑞士', 'Austria': '奥地利', 'Czech Republic': '捷克',
    'Paraguay': '巴拉圭', 'Ecuador': '厄瓜多尔',
    'South Africa': '南非', 'DR Congo': '刚果(金)', 'Panama': '巴拿马',
    'Jordan': '约旦', 'Uzbekistan': '乌兹别克斯坦',
    'New Zealand': '新西兰', 'Haiti': '海地', 'Cape Verde': '佛得角', 'Curaçao': '库拉索',
}


def scan_team(team, risk_level):
    """Scan a team for potential issues based on risk profile."""
    cn_name = TEAM_SEARCH_TERMS_CN.get(team, team)
    findings = []

    # Check if any existing events mention this team
    events_path = os.path.join(PROJECT_DIR, 'events.json')
    try:
        with open(events_path) as f:
            events_data = json.load(f)
        for e in events_data.get('events', []):
            if e.get('team') == team:
                findings.append({
                    'type': 'existing_event',
                    'team': team,
                    'message': f"已有事件: {e.get('event', '?')} (分类:{e.get('category','?')} 严重度:{e.get('severity',0)})",
                })
    except Exception:
        pass

    # Check risk profile
    if risk_level == 'high':
        findings.append({
            'type': 'risk_alert',
            'team': team,
            'message': f'⚠️ 高风险队伍 — 建议赛前深度扫描 {cn_name} 相关新闻',
        })

    return findings


def suggest_events(findings):
    """Generate suggested event entries from findings."""
    suggestions = []
    for f in findings:
        if f['type'] == 'risk_alert':
            suggestions.append({
                'team': f['team'],
                'category': 'locker_room',
                'suggestedAction': f'搜索 "{TEAM_SEARCH_TERMS_CN.get(f["team"], f["team"])} 内讧 冲突 更衣室" 确认是否有新事件',
                'template': {
                    'team': f['team'],
                    'event': '[待填写: 具体事件描述]',
                    'category': 'locker_room',
                    'reliability': 'rumor',
                    'severity': -15,
                    'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                    'expiresAfter': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                    'source': '[待填写: 消息来源]',
                    'note': '[待填写: 影响分析]',
                }
            })
    return suggestions


def main():
    team_filter = None
    high_risk_only = False
    suggest_mode = '--suggest' in sys.argv

    for a in sys.argv:
        if a.startswith('--team='):
            team_filter = a.split('=', 1)[1]
        if a == '--high-risk':
            high_risk_only = True

    # Load watchlist
    watchlist_path = os.path.join(PROJECT_DIR, 'news-watchlist.json')
    try:
        with open(watchlist_path) as f:
            watchlist = json.load(f)
    except Exception:
        watchlist = {}

    team_risks = watchlist.get('teamRiskProfiles', {})

    # Get teams to scan
    teams_to_scan = []
    if team_filter:
        teams_to_scan = [team_filter]
    elif high_risk_only:
        teams_to_scan = [t for t, p in team_risks.items()
                        if p.get('riskLevel', 'low') in ('high', 'medium')]
    else:
        # All 44 teams from search terms
        teams_to_scan = list(TEAM_SEARCH_TERMS_CN.keys())

    # Scan
    print(f'🔍 扫描 {len(teams_to_scan)} 支队伍...\n')
    all_findings = []
    for team in teams_to_scan:
        risk = team_risks.get(team, {}).get('riskLevel', DEFAULT_RISK)
        issues = team_risks.get(team, {}).get('knownIssues', '')
        findings = scan_team(team, risk)

        if risk in ('high', 'medium') or findings:
            cn = TEAM_SEARCH_TERMS_CN.get(team, team)
            risk_icon = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(risk, '🟢')
            print(f'{risk_icon} {cn} ({team}) 风险={risk}')
            if issues:
                print(f'   已知问题: {issues}')
            for f2 in findings:
                print(f'   {f2["message"]}')
            print()

        all_findings.extend(findings)

    # Suggestions
    if suggest_mode:
        suggestions = suggest_events(all_findings)
        if suggestions:
            print(f'\n📋 建议添加 {len(suggestions)} 条事件到 events.json:')
            for s in suggestions:
                print(f'\n  {s["team"]}: {s["suggestedAction"]}')
    else:
        print(f'\n共发现 {len(all_findings)} 条关注点')
        print('使用 --suggest 生成事件建议')
        print('使用 --team=England 单队深度扫描')

    # Quick reference
    print(f'\n── 扫描清单 ──')
    for item in watchlist.get('scanChecklist', []):
        print(f'  {item}')

    print(f'\n── 关键词速查 ──')
    for kw in KEYWORDS_NEGATIVE_HIGH[:5]:
        print(f'  🚨 {kw}')
    for kw in KEYWORDS_NEGATIVE_MED[:3]:
        print(f'  ⚠️ {kw}')


if __name__ == '__main__':
    main()
