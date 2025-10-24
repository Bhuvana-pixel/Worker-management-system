import { useState } from 'react';
import axios from 'axios';

function Register() {
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', location: '', gender: '', password: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/register', form);
      setMessage('✅ Registered successfully! You can now login.');
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Registration failed'}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required /><br />
        <input name="email" placeholder="Email" onChange={handleChange} required /><br />
        <input name="mobile" placeholder="Mobile" onChange={handleChange} required /><br />
        <input name="location" placeholder="Location" onChange={handleChange} required /><br />
        <input name="gender" placeholder="Gender" onChange={handleChange} required /><br />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required /><br />
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;
