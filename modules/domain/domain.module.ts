import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sport } from './sports/sport.entity';
import { Competition } from './competitions/competition.entity';
import { Season } from './seasons/season.entity';
import { Team } from './teams/team.entity';
import { TeamSeason } from './teams/team-season.entity';
import { Player } from './players/player.entity';
import { Match } from './matches/match.entity';
import { MatchEvent } from './matches/match-event.entity';
import { CompetitionsService } from './competitions/competitions.service';
import { MatchesService } from './matches/matches.service';
import { TeamsService } from './teams/teams.service';
import { PlayersService } from './players/players.service';
import { MatchEventsService } from './matches/match-events.service';

const ENTITIES = [Sport, Competition, Season, Team, TeamSeason, Player, Match, MatchEvent];
const SERVICES = [CompetitionsService, MatchesService, TeamsService, PlayersService, MatchEventsService];

@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES)],
  providers: SERVICES,
  exports: [TypeOrmModule, ...SERVICES],
})
export class DomainModule {}
