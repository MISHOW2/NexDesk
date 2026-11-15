import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

const roles = ['user', 'agent', 'admin'];
const roleLabels = { user: 'User', agent: 'Agent', admin: 'Admin' };

export default function UserManagementPage({ auth, onAgentRoleChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getUsers(auth)
      .then(data => { if (active) setUsers(data); })
      .catch(requestError => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [auth.token]);

  const changeRole = async (user, role) => {
    setSavingUserId(user.user_id);
    setError('');
    setNotice('');
    try {
      const updatedUser = await api.updateUserRole(auth, user.user_id, role);
      setUsers(current => current.map(currentUser => (
        currentUser.user_id === updatedUser.user_id ? updatedUser : currentUser
      )));
      if (user.role !== updatedUser.role && (user.role === 'agent' || updatedUser.role === 'agent')) {
        onAgentRoleChange();
      }
      setNotice(`${updatedUser.name} is now ${roleLabels[updatedUser.role]}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow green">ADMINISTRATION</span>
          <h1>User management</h1>
          <p>Manage who can access the service desk as an agent or administrator.</p>
        </div>
      </div>
      <section className="panel ticket-panel">
        <div className="panel-head" style={{ padding: '22px 24px 12px' }}>
          <div><h3>Workspace users</h3><p>Only administrators can change account roles.</p></div>
        </div>
        {error && <p className="admin-message error" role="alert">{error}</p>}
        {notice && <p className="admin-message success" role="status">{notice}</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>USER</th><th>DEPARTMENT</th><th>ROLE</th></tr></thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id}>
                  <td><strong>{user.name}</strong><small>{user.email}</small></td>
                  <td>{user.department}</td>
                  <td>
                    <select
                      aria-label={`Role for ${user.name}`}
                      value={user.role}
                      disabled={Number(user.user_id) === Number(auth.user_id) || savingUserId === user.user_id}
                      onChange={event => changeRole(user, event.target.value)}
                    >
                      {roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
                    </select>
                    {Number(user.user_id) === Number(auth.user_id) && <small className="role-hint">You can’t change your own role.</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="empty">Loading users…</div>}
          {!loading && !error && users.length === 0 && <div className="empty">No users found.</div>}
        </div>
      </section>
    </>
  );
}
