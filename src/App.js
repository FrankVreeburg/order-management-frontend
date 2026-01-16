import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState("home"); // Track which page to show
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingStock, setEditingStock] = useState("");

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
    fetch(`http://localhost:3000/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "processed" }),
    })
      .then((response) => response.json())
      .then((updatedOrder) => {
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

  const addProduct = (e) => {
    e.preventDefault();

    if (!newProductName || !newProductStock) {
      alert("Please fill in all fields");
      return;
    }

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
        setProducts([...products, newProduct]);
        setNewProductName("");
        setNewProductStock("");
        alert(`Product "${newProduct.name}" added successfully!`);
      })
      .catch((error) => {
        console.error("Error adding product:", error);
        alert("Failed to add product");
      });
  };

  const updateProductStock = (productId) => {
    if (!editingStock || editingStock < 0) {
      alert("Please enter a valid stock amount");
      return;
    }

    fetch(`http://localhost:3000/products/${productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stock: parseInt(editingStock) }),
    })
      .then((response) => response.json())
      .then((updatedProduct) => {
        // Update product in local state
        setProducts(
          products.map((product) =>
            product.id === productId ? updatedProduct : product,
          ),
        );
        // Clear editing state
        setEditingProductId(null);
        setEditingStock("");
        alert(`Stock updated successfully!`);
      })
      .catch((error) => {
        console.error("Error updating product:", error);
        alert("Failed to update stock");
      });
  };

  const getLowStockProducts = () => {
    const threshold = 60;
    return products.filter((product) => product.stock < threshold);
  };

  const getFilteredOrders = () => {
    if (orderFilter === "all") {
      return orders;
    }
    return orders.filter((order) => order.status === orderFilter);
  };

  const getSearchedProducts = () => {
    if (!productSearch) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()),
    );
  };

  const getSearchedAndFilteredOrders = () => {
    let filtered = getFilteredOrders();
    if (!orderSearch) return filtered;
    return filtered.filter(
      (order) =>
        order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.productName.toLowerCase().includes(orderSearch.toLowerCase()),
    );
  };

  // Render different content based on selected page
  const renderContent = () => {
    switch (currentPage) {
      case "home":
        return renderHomePage();
      case "orders":
        return renderOrdersPage();
      case "products":
        return renderProductsPage();
      default:
        return renderHomePage();
    }
  };

  // Home/Overview page
  const renderHomePage = () => (
    <>
      <h1 className="page-title">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-box" style={{ color: "#3b82f6" }}></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i
              className="fas fa-clipboard-list"
              style={{ color: "#10b981" }}
            ></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock" style={{ color: "#f59e0b" }}></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {orders.filter((o) => o.status === "pending").length}
            </div>
            <div className="stat-label">Pending Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i
              className="fas fa-exclamation-triangle"
              style={{ color: "#ef4444" }}
            ></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{getLowStockProducts().length}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {getLowStockProducts().length > 0 && (
        <div className="section">
          <h2 className="section-title">Low Stock Alerts</h2>
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

      {/* Recent Orders */}
      <div className="section">
        <h2 className="section-title">Recent Orders</h2>
        <div className="card">
          {orders.length === 0 ? (
            <p className="empty-state">No orders yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .slice(-5)
                  .reverse()
                  .map((order) => (
                    <tr key={order.id} className="table-row">
                      <td>#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td>{order.productName}</td>
                      <td>
                        <span
                          className={`badge ${order.status === "pending" ? "badge-orange" : "badge-green"}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );

  // Orders page
  const renderOrdersPage = () => (
    <>
      <h1 className="page-title">Orders Management</h1>

      <div className="section">
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

          {/* Search bar */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search orders by customer or product name..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 15px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Orders table */}
          {getSearchedAndFilteredOrders().length === 0 ? (
            <p className="empty-state">No orders found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {getSearchedAndFilteredOrders().map((order) => (
                  <tr key={order.id} className="table-row">
                    <td>#{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
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
    </>
  );

  // Products page
  const renderProductsPage = () => (
    <>
      <h1 className="page-title">Products Management</h1>

      {/* Add Product Form */}
      <div className="section">
        <h2 className="section-title">Add New Product</h2>
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

      {/* Current Inventory */}
      <div className="section">
        <h2 className="section-title">Current Inventory</h2>
        <div className="card">
          {/* Search bar */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search products by name..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 15px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          {getSearchedProducts().length === 0 ? (
            <p className="empty-state">
              No products found matching "{productSearch}"
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Stock Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSearchedProducts().map((product) => (
                  <tr key={product.id} className="table-row">
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>
                      {editingProductId === product.id ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="number"
                            value={editingStock}
                            onChange={(e) => setEditingStock(e.target.value)}
                            min="0"
                            style={{
                              width: "100px",
                              padding: "6px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => updateProductStock(product.id)}
                            className="button"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                          >
                            <i className="fas fa-check"></i> Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingProductId(null);
                              setEditingStock("");
                            }}
                            className="button"
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              backgroundColor: "#6b7280",
                            }}
                          >
                            <i className="fas fa-times"></i> Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`badge ${product.stock > 50 ? "badge-green" : "badge-orange"}`}
                        >
                          {product.stock} units
                        </span>
                      )}
                    </td>
                    <td>
                      {editingProductId !== product.id && (
                        <button
                          onClick={() => {
                            setEditingProductId(product.id);
                            setEditingStock(product.stock);
                          }}
                          className="button"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          <i className="fas fa-edit"></i> Edit Stock
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
    </>
  );

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>
            <i className="fas fa-warehouse"></i> Vreeburg
          </h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === "home" ? "active" : ""}`}
            onClick={() => setCurrentPage("home")}
          >
            <i className="fas fa-home"></i> Home
          </button>
          <button
            className={`nav-item ${currentPage === "orders" ? "active" : ""}`}
            onClick={() => setCurrentPage("orders")}
          >
            <i className="fas fa-clipboard-list"></i> Orders
          </button>
          <button
            className={`nav-item ${currentPage === "products" ? "active" : ""}`}
            onClick={() => setCurrentPage("products")}
          >
            <i className="fas fa-box"></i> Products
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">{renderContent()}</div>
    </div>
  );
}

export default App;
