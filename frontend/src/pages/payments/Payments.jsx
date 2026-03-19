import { useEffect, useState } from 'react';
import API from '../../api/axios';

const Payments = () => {
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await API.get('/workers');
      setWorkers(res.data.workers || []);
    } catch (err) {
      console.error('Failed to fetch workers');
    }
  };

  // 💰 HANDLE PAYMENT
  const handlePay = async (workerId) => {
    try {
      const res = await API.post(`/payments/pay/${workerId}`);

      // 🔄 Update UI instantly
      setWorkers((prev) =>
        prev.map((w) =>
          w._id === workerId ? res.data.worker : w
        )
      );
    } catch (err) {
      alert('Payment failed');
    }
  };

  // 🔍 FILTER BY NRC
  const filteredWorkers = workers.filter((w) =>
    w.nrc?.toLowerCase().includes(search.toLowerCase())
  );

  // 💡 FORMAT MONEY
  const format = (num) => Number(num || 0).toLocaleString();

  return (
    <div>
      <h2>👷 General Workers Payments</h2>

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Search Worker by NRC"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 15, padding: 8 }}
      />

      <table className="table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>NRC</th>
            <th>Phone</th>
            <th>Daily Rate</th>
            <th>Site</th>
            <th>Date Enrolled</th>
            <th>Days</th>
            <th>Paid (ZMW)</th>
            <th>Pending (ZMW)</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredWorkers.map((worker) => (
            <tr key={worker._id}>
              <td>{worker.name}</td>
              <td>{worker.nrc}</td>
              <td>{worker.phone}</td>
              <td>K{format(worker.dailyRate)}</td>
              <td>{worker.site}</td>
              <td>{new Date(worker.createdAt).toLocaleDateString()}</td>
              <td>{worker.daysWorked || 0}</td>

              <td>K{format(worker.paid)}</td>
              <td>K{format(worker.pending)}</td>

              <td>
                {/* 🔥 UPDATED LOGIC */}
                {worker.pending > 0 ? (
                  <button
                    className="btn btn-success"
                    onClick={() => handlePay(worker._id)}
                  >
                    Pay
                  </button>
                ) : (
                  <span style={{ color: 'green', fontWeight: 'bold' }}>
                    Paid ✔
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Payments;