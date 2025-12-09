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
        <div className='flex justify-center items-center h-screen'>
            <div className='mainlogin'>
                <h2 className='logintitle'>Cluster System Login</h2>
                
                {error && <div className='error'>{error}</div>}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className='phone'>Phone Number</label>
                        <input type="text" 
                            className='loginnumber'
                            placeholder='Phone Number'
                            onChange={e => setValues({...values, phone_number: e.target.value})}/>
                    </div>
                    <div>
                        <label className='password'>Password</label>
                        <input type="password" 
                            className='loginpassword'
                            placeholder='Password'
                            onChange={e => setValues({...values, password: e.target.value})}/>
                    </div>
                    <button className='loginbutton'>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login;