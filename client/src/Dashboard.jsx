import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
    const [role, setRole] = useState('');
    const [members, setMembers] = useState([]);
    const [records, setRecords] = useState([]);
    const [profile, setProfile] = useState({}); 
    const navigate = useNavigate();

    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        const storedId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if(!token) navigate('/');
        setRole(storedRole);

        // 1. Fetch My Profile (For everyone)
        axios.get(`http://localhost:8081/profile/${storedId}`, { headers: { Authorization: token } })
            .then(res => setProfile(res.data.Result || {}))
            .catch(err => console.log(err));

        // 2. Fetch Members (Leader only)
        if(storedRole === 'leader') {
            axios.get('http://localhost:8081/members', { headers: { Authorization: token } })
                .then(res => setMembers(res.data.Result || []))
                .catch(err => console.log(err));
        }

        // 3. Fetch Financial Records (Everyone)
        axios.get(`http://localhost:8081/my-records/${storedId}`, { headers: { Authorization: token } })
            .then(res => setRecords(res.data.Result || []))
            .catch(err => console.log(err));

    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    }

    return (
        <div className='min-h-screen bg-gray-50'>
            <nav className='bg-blue-700 text-white shadow-md'>
                <div className='max-w-6xl mx-auto px-4 py-4 flex justify-between items-center'>
                    <h1 className='text-xl font-bold tracking-wide'>Cluster Management</h1>
                    <button onClick={handleLogout} className='bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded text-sm'>Logout</button>
                </div>
            </nav>

            <div className='max-w-6xl mx-auto p-6 space-y-8'>
                
                {/* --- MY PROFILE SECTION (Visible to everyone) --- */}
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 items-center md:items-start'>
                    <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm flex-shrink-0 bg-gray-200'>
                        {profile.profile_picture ? (
                            <img src={`http://localhost:8081/images/${profile.profile_picture}`} alt="Profile" className='w-full h-full object-cover'/>
                        ) : (
                            <div className='w-full h-full flex items-center justify-center text-gray-400'>No Img</div>
                        )}
                    </div>
                    <div className='flex-1 space-y-2 text-center md:text-left'>
                        <h2 className='text-2xl font-bold text-gray-800'>{profile.full_name}</h2>
                        <div className='text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1'>
                            <p><span className='font-semibold'>Phone:</span> {profile.phone_number}</p>
                            <p><span className='font-semibold'>Role:</span> <span className='capitalize'>{profile.role}</span></p>
                            <p><span className='font-semibold'>Birthdate:</span> {profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : 'N/A'}</p>
                            <p><span className='font-semibold'>Spouse:</span> {profile.spouse_name || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* --- LEADER ONLY: MEMBER LIST --- */}
                {role === 'leader' && (
                    <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-xl font-bold text-gray-800'>All Cluster Members</h2>
                            <Link to="/add-member" className='bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700'>+ Add Member</Link>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {members.map((member, index) => (
                                /* ADDED onClick AND STYLING FOR CLICKABILITY */
                                <div key={index} 
                                     onClick={() => navigate(`/member/${member.id}`)}
                                     className='p-4 border rounded-lg bg-gray-50 flex items-center gap-4 cursor-pointer hover:bg-blue-50 transition border-transparent hover:border-blue-200'>
                                    <div className='w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0'>
                                        {member.profile_picture ? 
                                            <img src={`http://localhost:8081/images/${member.profile_picture}`} className='w-full h-full object-cover'/> : 
                                            <div className='w-full h-full flex items-center justify-center text-xs text-gray-500'>No Img</div>
                                        }
                                    </div>
                                    <div>
                                        <p className='font-semibold text-gray-700'>{member.full_name}</p>
                                        <p className='text-xs text-gray-500'>{member.phone_number}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- FINANCIAL RECORDS (Visible to everyone) --- */}
                <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
                    <div className='p-6 border-b'>
                        <h2 className='text-xl font-bold text-gray-800'>My Financial Records</h2>
                    </div>
                    <table className='w-full text-left'>
                        <thead className='bg-gray-100 text-gray-600 text-xs uppercase'>
                            <tr>
                                <th className='px-6 py-3'>Type</th>
                                <th className='px-6 py-3'>Amount</th>
                                <th className='px-6 py-3'>Status</th>
                                <th className='px-6 py-3'>Date</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100'>
                            {records.length > 0 ? records.map((rec, i) => (
                                <tr key={i}>
                                    <td className='px-6 py-4 capitalize'>{rec.type}</td>
                                    <td className='px-6 py-4'>₱{rec.amount}</td>
                                    <td className='px-6 py-4 font-semibold'>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            rec.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            rec.status === 'cashed_out' ? 'bg-gray-200 text-gray-500 line-through' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {rec.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4'>{new Date(rec.date_recorded).toLocaleDateString()}</td>
                                </tr>
                            )) : <tr><td colSpan="4" className="p-6 text-center text-gray-400">No records found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;