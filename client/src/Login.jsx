import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [values, setValues] = useState({ phone_number: '', password: '' });
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        axios.post('http://localhost:8081/login', values)
            .then(res => {
                if(res.data.Status === "Success") {
                    localStorage.setItem("token", res.data.token);
                    localStorage.setItem("role", res.data.role);
                    localStorage.setItem("userId", res.data.userId);
                    navigate('/dashboard');
                } else {
                    setError(res.data.Error);
                }
            })
            .catch(err => console.log(err));
    }

    return (
        <div className='flex justify-center items-center h-screen bg-slate-100'>
            <div className='bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-200'>
                <h2 className='text-2xl font-bold mb-6 text-center text-slate-700'>Cluster System Login</h2>
                
                {error && <div className='text-red-500 text-sm mb-4 text-center bg-red-100 p-2 rounded'>{error}</div>}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-slate-600 mb-1'>Phone Number</label>
                        <input type="text" 
                            className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
                            placeholder='09123456789'
                            onChange={e => setValues({...values, phone_number: e.target.value})}/>
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-slate-600 mb-1'>Password</label>
                        <input type="password" 
                            className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition'
                            placeholder='••••••••'
                            onChange={e => setValues({...values, password: e.target.value})}/>
                    </div>
                    <button className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200'>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login;