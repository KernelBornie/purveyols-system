import { useState } from 'react';

const NewProcurement = () => {
  const [items, setItems] = useState([
    { name: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    updated[index].total =
      updated[index].quantity * updated[index].unitPrice;

    setItems(updated);
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div>
      <h2>New Procurement Order</h2>

      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: 10, border: '1px solid #ccc', padding: 10 }}>
          
          <input
            placeholder="Item Name"
            value={item.name}
            onChange={(e) =>
              handleChange(index, 'name', e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Quantity"
            value={item.quantity}
            onChange={(e) =>
              handleChange(index, 'quantity', Number(e.target.value))
            }
          />

          <input
            type="number"
            placeholder="Unit Price"
            value={item.unitPrice}
            onChange={(e) =>
              handleChange(index, 'unitPrice', Number(e.target.value))
            }
          />

          <input
            value={`K${item.total}`}
            readOnly
          />
        </div>
      ))}

      {/* 🔥 ADD BUTTON */}
      <button onClick={addItem}>+ Add Another Item</button>

      <h3>Total: K{grandTotal}</h3>
    </div>
  );
};

export default NewProcurement;