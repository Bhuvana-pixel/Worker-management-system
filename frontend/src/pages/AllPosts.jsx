import React, { useEffect, useState } from "react";

const AllPosts = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/posts")
      .then(res => res.json())
      .then(setPosts);
  }, []);

  return (
    <div>
      <h2>🔍 Browse Available Services</h2>
      <ul>
        {posts.map(p => (
          <li key={p._id}>
            <strong>{p.title}</strong> — {p.skill} in {p.location}
            <p>{p.description}</p>
            <p><em>Posted by:</em> {p.workerId?.name || "Unknown"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AllPosts;
