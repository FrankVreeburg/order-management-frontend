import { useState, useEffect } from "react";
import "./App.css"; // Import the CSS file

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [orderFilter, setOrderFilter] = useState("all"); // 'all', 'pending', or 'processed'

  // Fetch data when component loads
  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = () => {
    fetch("http://localhost:3000/products")
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error fetching products:", error));
  };

  const fetchOrders = () => {
    fetch("http://localhost:3000/orders")
      .then((response) => response.json())
      .then((data) => setOrders(data))
      .catch((error) => console.error("Error fetching orders:", error));
  };

  const processOrder = (orderId) => {
    // Send PATCH request to backend to update order status
    fetch(`http://localhost:3000/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "processed" }),
    })
      .then((response) => response.json())
      .then((updatedOrder) => {
        // Update the order in our local state with the response from backend
        setOrders(
          orders.map((order) => (order.id === orderId ? updatedOrder : order)),
        );
        alert(`Order #${orderId} processed successfully!`);
      })
      .catch((error) => {
        console.error("Error processing order:", error);
        alert("Failed to process order");
      });
  };

  const getLowStockProducts = () => {
    const threshold = 60; // Products with stock below this are "low"
    return products.filter((product) => product.stock < threshold);
  };

  const addProduct = (e) => {
    e.preventDefault(); // Prevents page refresh on form submit

    // Validation
    if (!newProductName || !newProductStock) {
      alert("Please fill in all fields");
      return;
    }

    // Send POST request to backend
    fetch("http://localhost:3000/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newProductName,
        stock: parseInt(newProductStock),
      }),
    })
      .then((response) => response.json())
      .then((newProduct) => {
        // Add new product to local state
        setProducts([...products, newProduct]);
        // Clear form
        setNewProductName("");
        setNewProductStock("");
        alert(`Product "${newProduct.name}" added successfully!`);
      })
      .catch((error) => {
        console.error("Error adding product:", error);
        alert("Failed to add product");
      });
  };

  const getFilteredOrders = () => {
    if (orderFilter === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === orderFilter);
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1 className="title">📦 Order Management Dashboard</h1>
        <p className="subtitle">Warehouse Control Center</p>
      </div>

      {/* Low Stock Alerts - add this after the header div */}
      {getLowStockProducts().length > 0 && (
        <div className="section">
          <h2 className="section-title">⚠️ Low Stock Alerts</h2>
          <div
            className="card"
            style={{
              backgroundColor: "#fef3c7",
              borderLeft: "4px solid #f59e0b",
            }}
          >
            <p style={{ marginTop: 0, fontWeight: "600", color: "#92400e" }}>
              The following products need restocking:
            </p>
            <ul style={{ color: "#92400e" }}>
              {getLowStockProducts().map((product) => (
                <li key={product.id}>
                  <strong>{product.name}</strong> - Only {product.stock} units
                  remaining
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Add Product Form */}
      <div className="section">
        <h2 className="section-title">➕ Add New Product</h2>
        <div className="card">
          <form
            onSubmit={addProduct}
            style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "600",
                }}
              >
                Product Name
              </label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="e.g., Widget C"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "600",
                }}
              >
                Initial Stock
              </label>
              <input
                type="number"
                value={newProductStock}
                onChange={(e) => setNewProductStock(e.target.value)}
                placeholder="e.g., 100"
                min="0"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            <button type="submit" className="button">
              Add Product
            </button>
          </form>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="section">
        <h2 className="section-title">📊 Current Inventory</h2>
        <div className="card">
          <table className="table">
            <thead>
              <tr className="table-header">
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Stock Level</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="table-row">
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>
                    <span
                      className={`badge ${product.stock > 50 ? "badge-green" : "badge-orange"}`}
                    >
                      {product.stock} units
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Section */}
      <div className="section">
        <h2 className="section-title">📋 Incoming Orders</h2>
        <div className="card">
          {/* Filter buttons */}
          <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => setOrderFilter("all")}
              className="button"
              style={{
                backgroundColor: orderFilter === "all" ? "#3b82f6" : "#e5e7eb",
                color: orderFilter === "all" ? "white" : "#374151",
              }}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setOrderFilter("pending")}
              className="button"
              style={{
                backgroundColor:
                  orderFilter === "pending" ? "#f59e0b" : "#e5e7eb",
                color: orderFilter === "pending" ? "white" : "#374151",
              }}
            >
              Pending ({orders.filter((o) => o.status === "pending").length})
            </button>
            <button
              onClick={() => setOrderFilter("processed")}
              className="button"
              style={{
                backgroundColor:
                  orderFilter === "processed" ? "#10b981" : "#e5e7eb",
                color: orderFilter === "processed" ? "white" : "#374151",
              }}
            >
              Processed ({orders.filter((o) => o.status === "processed").length}
              )
            </button>
          </div>

          {/* Orders table */}
          {getFilteredOrders().length === 0 ? (
            <p className="empty-state">
              No {orderFilter === "all" ? "" : orderFilter} orders found.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredOrders().map((order) => (
                  <tr key={order.id} className="table-row">
                    <td>#{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td>
                      <span
                        className={`badge ${order.status === "pending" ? "badge-orange" : "badge-green"}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.status === "pending" && (
                        <button
                          onClick={() => processOrder(order.id)}
                          className="button"
                        >
                          Process Order
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
