import { Routes, Route } from 'react-router-dom';

function Home() {
    return (
        <div>
            <h1>Baseline AWS</h1>
            <p>Secure serverless web application</p>
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
        </Routes>
    );
}
