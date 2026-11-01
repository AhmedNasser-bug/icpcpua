import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Medal, Trophy } from "lucide-react";
import { api } from "../../../shared/services/api.js";
export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/events/leaderboard').then(({
      leaderboard: results
    }) => setLeaderboard(results)).catch(reason => setError(reason.message)).finally(() => setLoading(false));
  }, []);
  return <main className="page-wrap leaderboard-page">
    <header className="leaderboard-title-card">
      <span className="leaderboard-title-icon"><Trophy size={22} aria-hidden="true" /></span>
      <div>
        <h1>Leaderboard</h1>
      </div>
    </header>
    {error && <div className="notice error-notice">{error}</div>}
    {loading ? <div className="empty-state"><span className="loader" /> Loading the leaderboard...</div> : leaderboard.length ? <>
      <section className={`leaderboard-podium leaderboard-podium-count-${Math.min(leaderboard.length, 3)}`} aria-labelledby="leaderboard-podium-title">
        <div className="podium-heading">
          <span className="podium-heading-icon"><Trophy size={19} aria-hidden="true" /></span>
          <div>
            <h2 id="leaderboard-podium-title">Top performers</h2>
          </div>
          <span className="podium-heading-count">TOP {Math.min(leaderboard.length, 3)}</span>
        </div>
        <div className="podium-grid">
          {leaderboard.slice(0, 3).map((member, index) => {
            const place = index + 1;
            const memberContent = <>
              <span className="podium-avatar" aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}{member.avatarUrl && <img src={member.avatarUrl} alt="" loading="lazy" onError={event => event.currentTarget.remove()} />}</span>
              <span className="podium-member-name">{member.name}</span>
              <span className="podium-points"><Trophy size={15} aria-hidden="true" /> {member.points} <small>points</small></span>
              <span className="podium-stats"><span>{member.problemsSolved} solved</span><span aria-hidden="true">·</span><span>{member.eventsAttended} events</span></span>
            </>;
            const memberLink = member.username
              ? <Link className="podium-member" to={`/users/${member.username}`}>{memberContent}</Link>
              : <div className="podium-member">{memberContent}</div>;
            return <article className={`podium-place podium-place-${place}`} key={member.userId}>
              <div className="podium-card">
                <span className="podium-medal" aria-label={`Rank ${member.rank}`}>
                  {place === 1 ? <Crown size={17} aria-hidden="true" /> : <Medal size={17} aria-hidden="true" />}
                  <span>#{member.rank}</span>
                </span>
                {memberLink}
              </div>
              </article>;
          })}
        </div>
      </section>
      <section className="leaderboard-card" role="table" aria-label="Community leaderboard"><div className="leaderboard-head" role="row"><span role="columnheader">RANK</span><span role="columnheader">MEMBER</span><span role="columnheader">EVENTS</span><span role="columnheader">SOLVED</span><span role="columnheader">POINTS</span></div>
        {leaderboard.map(member => {
          const identity = <><span className="leaderboard-avatar" aria-hidden="true">{member.name.trim().charAt(0).toUpperCase()}{member.avatarUrl && <img src={member.avatarUrl} alt="" loading="lazy" onError={event => event.currentTarget.remove()} />}</span><span className="leaderboard-member-name">{member.name}</span></>;
          return <div className="leaderboard-row" key={member.userId} role="row">
            <span className="leaderboard-rank" role="cell">{String(member.rank).padStart(2, '0')}</span>
            {member.username ? <Link className="leaderboard-member-link" to={`/users/${member.username}`} role="cell">{identity}</Link> : <div className="leaderboard-member-link" role="cell">{identity}</div>}
            <span className="leaderboard-metric" role="cell">{member.eventsAttended}</span>
            <span className="leaderboard-metric" role="cell">{member.problemsSolved}</span>
            <strong role="cell"><Trophy size={16} /> {member.points}</strong>
          </div>;
        })}
      </section>
    </> : <div className="empty-state"><span className="empty-icon"><Trophy size={24} /></span><h3>The first points are up for grabs.</h3><p>Check in at an event to get on the leaderboard.</p></div>}
  </main>;
}
