import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
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
    <div className="page-heading"><h1><span>leaderboard</span></h1></div>
    {error && <div className="notice error-notice">{error}</div>}
    {loading ? <div className="empty-state"><span className="loader" /> Loading the leaderboard...</div> : leaderboard.length ? <section className="leaderboard-card"><div className="leaderboard-head"><span>RANK</span><span>MEMBER</span><span>EVENTS</span><span>POINTS</span></div>
        {leaderboard.map(member => <div className="leaderboard-row" key={member.userId}><span className="leaderboard-rank">{String(member.rank).padStart(2, '0')}</span>{member.username ? <Link className="leaderboard-member-link" to={`/users/${member.username}`}>{member.name}</Link> : <span>{member.name}</span>}<span>{member.eventsAttended}</span><strong><Trophy size={16} /> {member.points}</strong></div>)}
      </section> : <div className="empty-state"><span className="empty-icon"><Trophy size={24} /></span><h3>The first points are up for grabs.</h3><p>Check in at an event to get on the leaderboard.</p></div>}
  </main>;
}
