import React, { Component } from 'react';
import isEmpty from 'lodash/isEmpty';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      view: 'date'
    };
  }

  componentDidMount() {
    fetch('http://statsapi.mlb.com/api/v1/schedule/postseason/series?sportId=1&season=2018&hydrate=team,broadcasts(all),seriesStatus(useOverride=true),decisions,person,probablePitcher,linescore(matchup)')
      .then(response => response.json())
      .then(data =>  
        data.series.map((wholeSeries) => {
          return wholeSeries
        })
      )
      .then(data =>  
        data.map((eachSeries) => {
          return eachSeries
        })
      )
      .then(data =>  
        data.map((games) => {
          return games
        })
      )
      .then(data  =>  
        data.map((game) => {
          return game.games
        })
      )
      .then(data  => this.setState({ data }))
  }

  toggleView = (view) => {
    this.setState({ view: view.target.id });
  }

  sortBySeries = () => {
    const eachGame = [];
    if(this.state.data.length) {
      this.state.data.map((eachSeries) => {
        eachSeries.map((game) => {
          eachGame.push(game)
        });
      })
    }

    return eachGame.sort((a, b) => {
      return new Date(a.gameDate).getDate() - new Date(b.gameDate).getDate();
    });
  }

  // Function that return string that describes the series score
  seriesDescription = (seriesDescription = {}, series) => {
    const teamWins = {};

    // Logic to differentiate necessary series wins to advance to next round
    let winsToAdvance = 4;
    if(series === 'NL Division Series' || series === 'AL Division Series') {
      winsToAdvance = 3;
    } else if(series === 'NL Wild Card Game' || series === 'AL Wild Card Game') {
      winsToAdvance = 1;
    }
    Object.keys(seriesDescription).map((eachTeam) => {
      return teamWins[seriesDescription[eachTeam].team.teamName.toUpperCase()] = seriesDescription[eachTeam].leagueRecord.wins;
    })
    const teamComparison = Object.entries(teamWins)

    //Description logic for tie-breakers
    if(teamComparison[0][1] > winsToAdvance || teamComparison[1][1] > winsToAdvance) {
      if(teamComparison[0][1] > teamComparison[1][1]) {
        return `${teamComparison[0][0]} ADVANCES`
      }else{
        return `${teamComparison[1][0]} ADVANCES`
      }
    }

    if(teamComparison[0][1] === winsToAdvance || teamComparison[1][1] === winsToAdvance) {
      if(teamComparison[0][1] > teamComparison[1][1]) {
        return `${teamComparison[0][0]} WINS ${teamComparison[0][1]} - ${teamComparison[1][1]}`
      }else{
        return `${teamComparison[1][0]} WINS ${teamComparison[0][1]} - ${teamComparison[1][1]}`
      }
    }

    if(teamComparison[0][1] === teamComparison[1][1]) {
      return `SERIES TIED ${teamComparison[0][1]} - ${teamComparison[1][1]}`
    } else if (teamComparison[0][1] > teamComparison[1][1]) {
      return `${teamComparison[0][0]} LEAD ${teamComparison[0][1]} - ${teamComparison[1][1]}`
    } else {
      return `${teamComparison[1][0]} LEAD ${teamComparison[1][1]} - ${teamComparison[0][1]}`
    }
  }

  parseGameStats = (indGameArr = []) => {
    const game = indGameArr.map((indGame) => {
      const {
        broadcasts,
        teams: {
          away,
          home
        },
        decisions: {
          winner,
          loser,
          save
        }
      } = indGame;

      // Link helper functions
      function showTeamLink(team) {
        return 'https://www.mlb.com/' + team.team.teamName.toLowerCase();
      }

      function showPitcherLink(pitcher) {
        return 'https://www.mlb.com/player/' + pitcher.nameSlug;
      }

      function showTeamLogo(teamId) {
        return 'https://www.mlbstatic.com/team-logos/' + teamId + '.svg';
      }
      // show the name of first TV broadcast within the array of broadcasts
      // Wanted to show image of the TV broadcast, but couldn't find an API to do so
      const firstTVbroadCast = broadcasts.find((broadcast) => {return broadcast.type == 'TV'})

      return(
        <div className='each__game'>
          <div className='each__game--description'>{indGame.description} - {this.seriesDescription(indGame.teams, indGame.seriesDescription)}</div>
          <tr>
            <th>
              <a className='team__link' href={showTeamLink(away)}>
                <img className='team__logo' src={showTeamLogo(away.team.id)} />
                {away.team.teamName}
              </a> 
              {away.score}
            </th>
            <th>
              @ 
              <a className='team__link' href={showTeamLink(home)}>
                <img className='team__logo' src={showTeamLogo(home.team.id)} />
                {home.team.teamName}
              </a> 
              {home.score}
            </th>
            <th>
              {indGame.status.detailedState.toUpperCase()}
            </th>
            <th>
              {firstTVbroadCast.callSign}
            </th>
            <th>
              <span>W: <a className='pitcher__link' href={showPitcherLink(winner)}>{winner.initLastName}</a></span>
            </th>
            <th>
              <span>L: <a className='pitcher__link' href={showPitcherLink(loser)}>{loser.initLastName}</a></span>
            </th>
            <th>
              {!isEmpty(save) &&
                <span>SV: <a className='pitcher__link' href={showPitcherLink(save)}>{save.lastName}</a></span>
              }
            </th>
          </tr>
        </div>
      )
    })

    return game;
  }

  showCalendarView = () => {
    const sortByDate = {};
    const totalGames = this.sortBySeries();
    totalGames.map((eachGame) => {
      // Used calendarEventID, instead of gameDate because I wanted to sort by start date, instead of game end time
      const game = eachGame.calendarEventID.split('-').splice(2, 4).join('/') 
      if(sortByDate[game]) {
        sortByDate[game].push(eachGame);
      } else {
        sortByDate[game] = [eachGame];
      }
    })

    const result = Object.keys(sortByDate).map((indGameArr) => {
      const gameDate = new Date(indGameArr);

      return (
        <section>
          <h2>{gameDate.toDateString()}</h2>
          <table>
            {this.parseGameStats(sortByDate[indGameArr])}
          </table>
        </section>
        )
    })
    return result;
  }

  showRoundView = () => {
    const sortByRound = {};
    const totalGames = this.sortBySeries();
    totalGames.map((eachGame) => {
      if(sortByRound[eachGame.seriesDescription]) {
        sortByRound[eachGame.seriesDescription].push(eachGame);
      } else {
        sortByRound[eachGame.seriesDescription] = [eachGame];
      }
    })
    const result = Object.keys(sortByRound).map((indGameArr) => {
      return (
        <section>
          <h2>{indGameArr}</h2>
          <table>
            {this.parseGameStats(sortByRound[indGameArr])}
          </table>
        </section>
        )
    })
    return result;
  }

  displayToggleButton = () => {
    return(
      <section className='toggle--buttons'>
        <button id='date' className={this.state.view === 'date' ? 'active' : ''} onClick={this.toggleView}>
          By Date
        </button>
        <button id='round' className={this.state.view === 'round' ? 'active' : ''}onClick={this.toggleView}>
          By Round
        </button>
      </section>
      )
  }

  render() {
    return (
      <div>
        <nav className="app--nav">
          <span>
            <a className="mlb--logo" href='https://www.mlb.com'>
              <img src="//www.mlbstatic.com/team-logos/league-on-dark/1.svg" />
            </a>
          </span>
          <span>
            2018 MLB Postseason Schedule
          </span>
        </nav>
        {this.displayToggleButton()}
        <section className="App-intro">
          {this.state.view === 'date'
            && this.showCalendarView()
          }
          {this.state.view === 'round'
            && this.showRoundView()
          }
        </section>
      </div>
    );
  }
}
export default App;