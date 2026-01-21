import { useState, useEffect } from "react";
import "./App.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

// Helper function to make authenticated API requests
const fetchWithAuth = (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(true); // true = login, false = register
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [workers, setWorkers] = useState([]);
  const [showAddWorkerForm, setShowAddWorkerForm] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: "",
    email: "",
    role: "Picker",
    phone: "",
  });
  const [editingWorker, setEditingWorker] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    stock: "",
    eanCode: "",
    description: "",
    category: "",
    supplier: "",
    price: "",
    minStock: "",
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    fetchWorkers();
  }, []);

  const fetchProducts = () => {
    const token = localStorage.getItem('authToken');
    fetch('http://localhost:3000/products', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
    })
      .then((response) => response.json())
      .then((data) => {
        // Convert database column names to camelCase AND convert types
        const convertedData = data.map((product) => ({
          id: product.id,
          name: product.name,
          stock: parseInt(product.stock) || 0,
          eanCode: product.ean_code || "", // ← Convert column name
          description: product.description || "",
          category: product.category || "",
          supplier: product.supplier || "",
          price: parseFloat(product.price) || 0,
          minStock: parseInt(product.min_stock) || 0, // ← Convert column name
        }));
        setProducts(convertedData);
      })
      .catch((error) => console.error("Error fetching products:", error));
  };

  const fetchOrders = () => {
    const token = localStorage.getItem('authToken');
    fetch('http://localhost:3000/orders', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
    })
      .then((response) => response.json())
      .then((data) => {
        // Convert database column names to camelCase AND convert types
        const convertedData = data.map((order) => ({
          id: order.id,
          productId: parseInt(order.product_id) || 0,
          productName: order.product_name || "",
          quantity: parseInt(order.quantity) || 0,
          customerName: order.customer_name || "", // ← Convert column name
          status: order.status || "pending",
          createdAt: order.created_at || new Date(),
        }));
        setOrders(convertedData);
      })
      .catch((error) => console.error("Error fetching orders:", error));
  };

  const fetchWorkers = () => {
        const token = localStorage.getItem('authToken');
    fetch('http://localhost:3000/workers', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
    })
      .then((response) => response.json())
      .then((data) => {
        // Convert boolean values properly
        const convertedData = data.map((worker) => ({
          ...worker,
          active: worker.active === true || worker.active === "true",
        }));
        setWorkers(convertedData);
      })
      .catch((error) => console.error("Error fetching workers:", error));
  };

  const processOrder = (orderId) => {
    const token = localStorage.getItem('authToken');

    fetch(`http://localhost:3000/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
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
      alert("Please fill in all fields and stock");
      return;
    }

    const token = localStorage.getItem('authToken');

    fetch("http://localhost:3000/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newProductName,
        stock: parseInt(newProductStock),
        eanCode: "",
        description: "",
        category: "",
        supplier: "",
        price: 0,
        minStock: 0,
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

  const viewProductDetails = (product) => {
    setSelectedProduct(product);
    setIsEditingProduct(false);
  };

  const startEditingProduct = () => {
    setEditProductForm({
      name: selectedProduct.name,
      stock: selectedProduct.stock,
      eanCode: selectedProduct.eanCode || "",
      description: selectedProduct.description || "",
      category: selectedProduct.category || "",
      supplier: selectedProduct.supplier || "",
      price: selectedProduct.price || "",
      minStock: selectedProduct.minStock || "",
    });
    setIsEditingProduct(true);
  };

  const saveProductChanges = () => {
    const token = localStorage.getItem('authToken');

    const dataToSend = {
      name: editProductForm.name,
      stock: editProductForm.stock,
      eanCode: editProductForm.eanCode,
      description: editProductForm.description,
      category: editProductForm.category,
      supplier: editProductForm.supplier,
      price: editProductForm.price,
      minStock: editProductForm.minStock,
  };

  fetch(`http://localhost:3000/products/${selectedProduct.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(dataToSend),
  })
    .then((response) => response.json())
    .then((updatedProduct) => { 
      const converted = { // Convert camelCase to snake_case for database
        id: updatedProduct.id,
        name: updatedProduct.name,
        stock: parseInt(updatedProduct.stock) || 0,
        eanCode: updatedProduct.ean_code || "",
        description: updatedProduct.description || "",
        category: updatedProduct.category || "",
        supplier: updatedProduct.supplier || "",
        price: parseFloat(updatedProduct.price) || 0,
        minStock: parseInt(updatedProduct.min_stock) || 0,
      };

      setProducts(
        products.map((p) => (p.id === converted.id ? converted : p)),
      );
      setSelectedProduct(converted);
      setIsEditingProduct(false);
      alert("Product updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    });
};

  const updateProductStock = (productId) => {
    if (!editingStock || editingStock < 0) {
      alert("Please enter a valid stock amount");
      return;
    }

     const token = localStorage.getItem('authToken');

    fetch(`http://localhost:3000/products/${productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
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

  const exportOrdersToCSV = () => {
    // Get the orders to export (respects current filter and search)
    const ordersToExport = getSearchedAndFilteredOrders();

    if (ordersToExport.length === 0) {
      alert("No orders to export");
      return;
    }

    // CSV Headers
    const headers = [
      "Order ID",
      "Customer Name",
      "Product Name",
      "Quantity",
      "Status",
      "Created Date",
    ];

    // Convert orders to CSV rows
    const rows = ordersToExport.map((order) => [
      order.id,
      order.customerName,
      order.productName,
      order.quantity,
      order.status,
      new Date(order.createdAt).toLocaleString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `orders_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Exported ${ordersToExport.length} orders successfully!`);
  };

  const exportProductsToCSV = () => {
    // Get the products to export (respects current search)
    const productsToExport = getSearchedProducts();

    if (productsToExport.length === 0) {
      alert("No products to export");
      return;
    }

    // CSV Headers
    const headers = ["Product ID", "Product Name", "Stock Level"];

    // Convert products to CSV rows
    const rows = productsToExport.map((product) => [
      product.id,
      product.name,
      product.stock,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `products_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Exported ${productsToExport.length} products successfully!`);
  };

  const downloadProductTemplate = () => {
    const headers = [
      "name",
      "stock",
      "eanCode",
      "description",
      "category",
      "supplier",
      "price",
      "minStock",
    ];
    const exampleRow = [
      "Example Widget",
      "100",
      "8712345678903",
      "A great product",
      "Widgets",
      "ABC Corp",
      "29.99",
      "20",
    ];

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "product_import_template.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseAndImportProducts(text);
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = "";
  };

  const parseAndImportProducts = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      alert("CSV file is empty or invalid");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const requiredHeaders = ["name", "stock"];

    // Check if required headers exist
    const hasRequired = requiredHeaders.every((h) => headers.includes(h));
    if (!hasRequired) {
      alert('CSV must have at least "name" and "stock" columns');
      return;
    }

    const productsToImport = [];

    // Parse each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const product = {};

      headers.forEach((header, index) => {
        product[header] = values[index] || "";
      });

      // Validate required fields
      if (!product.name || !product.stock) {
        console.warn(`Skipping row ${i + 1}: missing name or stock`);
        continue;
      }

      productsToImport.push({
        name: product.name,
        stock: parseInt(product.stock) || 0,
        eanCode: product.eanCode || "",
        description: product.description || "",
        category: product.category || "",
        supplier: product.supplier || "",
        price: parseFloat(product.price) || 0,
        minStock: parseInt(product.minStock) || 0,
      });
    }

    if (productsToImport.length === 0) {
      alert("No valid products found in CSV");
      return;
    }

    // Import products one by one
    let imported = 0;
    let failed = 0;

    const importNext = (index) => {
      if (index >= productsToImport.length) {
        alert(`Import complete!\nSuccessful: ${imported}\nFailed: ${failed}`);
        fetchProducts(); // Refresh the product list
        return;
      }

      const token = localStorage.getItem('authToken');

      fetch("http://localhost:3000/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify(productsToImport[index]),
      })
        .then((response) => response.json())
        .then(() => {
          imported++;
          importNext(index + 1);
        })
        .catch((error) => {
          console.error("Error importing product:", error);
          failed++;
          importNext(index + 1);
        });
    };

    importNext(0);
  };

  const downloadOrderTemplate = () => {
    const headers = ["productId", "quantity", "customerName"];
    const exampleRow = ["1", "10", "John Doe"];

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "order_import_template.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOrderFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseAndImportOrders(text);
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = "";
  };

  const parseAndImportOrders = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      alert("CSV file is empty or invalid");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const requiredHeaders = ["productId", "quantity", "customerName"];

    // Check if required headers exist
    const hasRequired = requiredHeaders.every((h) => headers.includes(h));
    if (!hasRequired) {
      alert(
        'CSV must have "productId", "quantity", and "customerName" columns',
      );
      return;
    }

    const ordersToImport = [];

    // Parse each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const order = {};

      headers.forEach((header, index) => {
        order[header] = values[index] || "";
      });

      // Validate required fields
      if (!order.productId || !order.quantity || !order.customerName) {
        console.warn(`Skipping row ${i + 1}: missing required fields`);
        continue;
      }

      ordersToImport.push({
        productId: parseInt(order.productId),
        quantity: parseInt(order.quantity),
        customerName: order.customerName,
      });
    }

    if (ordersToImport.length === 0) {
      alert("No valid orders found in CSV");
      return;
    }

    // Import orders one by one
    let imported = 0;
    let failed = 0;

    const importNext = (index) => {
      if (index >= ordersToImport.length) {
        alert(`Import complete!\nSuccessful: ${imported}\nFailed: ${failed}`);
        fetchOrders(); // Refresh the order list
        return;
      }

      const token = localStorage.getItem('authToken'); 

      fetch("http://localhost:3000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(ordersToImport[index]),
      })
        .then((response) => response.json())
        .then(() => {
          imported++;
          importNext(index + 1);
        })
        .catch((error) => {
          console.error("Error importing order:", error);
          failed++;
          importNext(index + 1);
        });
    };

    importNext(0);
  };

  const addWorker = (e) => {
    e.preventDefault();

    if (!newWorker.name || !newWorker.email) {
      alert("Name and email are required");
      return;
    }

      const token = localStorage.getItem('authToken');

    fetch("http://localhost:3000/workers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(newWorker),
    })
      .then((response) => response.json())
      .then((worker) => {
        setWorkers([...workers, worker]);
        setNewWorker({ name: "", email: "", role: "Picker", phone: "" });
        setShowAddWorkerForm(false);
        alert(`Worker "${worker.name}" added successfully!`);
      })
      .catch((error) => {
        console.error("Error adding worker:", error);
        alert("Failed to add worker");
      });
  };

  const updateWorker = (workerId, updates) => {
    const token = localStorage.getItem('authToken');

    fetch(`http://localhost:3000/workers/${workerId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })
      .then((response) => response.json())
      .then((updatedWorker) => {
        setWorkers(workers.map((w) => (w.id === workerId ? updatedWorker : w)));
        setEditingWorker(null);
        alert("Worker updated successfully!");
      })
      .catch((error) => {
        console.error("Error updating worker:", error);
        alert("Failed to update worker");
      });
  };

  const deleteWorker = (workerId) => {
    if (!window.confirm("Are you sure you want to delete this worker?")) {
      return;
    }

    const token = localStorage.getItem('authToken');

    fetch(`http://localhost:3000/workers/${workerId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then(() => {
        setWorkers(workers.filter((w) => w.id !== workerId));
        alert("Worker deleted successfully!");
      })
      .catch((error) => {
        console.error("Error deleting worker:", error);
        alert("Failed to delete worker");
      });
  };

  const toggleWorkerStatus = (workerId, currentStatus) => {
    updateWorker(workerId, { active: !currentStatus });
  };

  // Check if user is already logged in (on app load)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // Verify token is still valid
      fetch("http://localhost:3000/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.valid) {
            setIsAuthenticated(true);
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem("authToken");
          }
        })
        .catch(() => {
          localStorage.removeItem("authToken");
        });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem("authToken", data.token);
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setAuthForm({ username: "", email: "", password: "" });
        alert(`Welcome back, ${data.user.username}!`);
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
          role: "user",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account created! Please log in.");
        setShowLoginForm(true);
        setAuthForm({ username: "", email: "", password: "" });
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    setCurrentUser(null);
    alert("Logged out successfully");
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
      case "workers":
        return renderWorkersPage();
      default:
        return renderHomePage();
    }
  };

  // Home/Overview page with charts
  const renderHomePage = () => {
    // Calculate stats
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const processedOrders = orders.filter(
      (o) => o.status === "processed",
    ).length;
    const lowStockItems = getLowStockProducts().length;
    const activeWorkers = workers.filter((w) => w.active).length;

    // Orders by status chart data
    const orderStatusData = {
      labels: ["Pending", "Processed"],
      datasets: [
        {
          label: "Orders",
          data: [pendingOrders, processedOrders],
          backgroundColor: ["#f59e0b", "#10b981"],
          borderWidth: 0,
        },
      ],
    };

    // Stock levels chart data (top 10 products)
    const stockData = {
      labels: products.slice(0, 10).map((p) => p.name),
      datasets: [
        {
          label: "Stock Level",
          data: products.slice(0, 10).map((p) => p.stock),
          backgroundColor: products
            .slice(0, 10)
            .map((p) => (p.stock > 50 ? "#10b981" : "#f59e0b")),
          borderWidth: 0,
        },
      ],
    };

    // Recent orders trend (last 7 days mock data - you'd calculate this from real dates)
    const orderTrendData = {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Orders",
          data: [12, 19, 15, 25, 22, 30, orders.length], // Mock data, replace with real calculation
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };

    // Workers by role
    const workersByRole = workers.reduce((acc, worker) => {
      acc[worker.role] = (acc[worker.role] || 0) + 1;
      return acc;
    }, {});

    const workersRoleData = {
      labels: Object.keys(workersByRole),
      datasets: [
        {
          data: Object.values(workersByRole),
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
          borderWidth: 0,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
      },
    };

    return (
      <>
        <h1 className="page-title">
          <i className="fas fa-chart-line"></i> Dashboard Overview
        </h1>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-box" style={{ color: "#3b82f6" }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalProducts}</div>
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
              <div className="stat-value">{totalOrders}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-clock" style={{ color: "#f59e0b" }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{pendingOrders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-users" style={{ color: "#8b5cf6" }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{activeWorkers}</div>
              <div className="stat-label">Active Workers</div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems > 0 && (
          <div className="section">
            <h2 className="section-title">
              <i className="fas fa-exclamation-triangle"></i> Low Stock Alerts
            </h2>
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

        {/* Charts Section */}
        <div className="charts-grid">
          {/* Orders Status Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <i className="fas fa-chart-pie"></i> Orders by Status
            </h3>
            <div style={{ height: "250px" }}>
              <Doughnut data={orderStatusData} options={chartOptions} />
            </div>
          </div>

          {/* Stock Levels Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <i className="fas fa-chart-bar"></i> Product Stock Levels
            </h3>
            <div style={{ height: "250px" }}>
              <Bar data={stockData} options={chartOptions} />
            </div>
          </div>

          {/* Orders Trend Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <i className="fas fa-chart-line"></i> Orders Trend (Last 7 Days)
            </h3>
            <div style={{ height: "250px" }}>
              <Line data={orderTrendData} options={chartOptions} />
            </div>
          </div>

          {/* Workers by Role Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <i className="fas fa-users-cog"></i> Workers by Role
            </h3>
            <div style={{ height: "250px" }}>
              <Doughnut data={workersRoleData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="section">
          <h2 className="section-title">
            <i className="fas fa-history"></i> Recent Orders
          </h2>
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
  };

  // Orders page
  const renderOrdersPage = () => (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1 className="page-title" style={{ margin: 0 }}>
          <i className="fas fa-clipboard-list"></i> Orders Management
        </h1>
        <button
          onClick={exportOrdersToCSV}
          className="button"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-download"></i> Export to CSV
        </button>
      </div>

      {/* Import Orders from CSV */}
      <div className="section">
        <h2 className="section-title">
          <i className="fas fa-upload"></i> Import Orders from CSV
        </h2>
        <div className="card">
          <p style={{ marginBottom: "15px", color: "#6b7280" }}>
            Upload a CSV file with columns:{" "}
            <strong>productId, quantity, customerName</strong>
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleOrderFileUpload}
              id="order-csv-upload"
              style={{ display: "none" }}
            />
            <label
              htmlFor="order-csv-upload"
              className="button"
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="fas fa-file-csv"></i> Choose CSV File
            </label>
            <button
              onClick={downloadOrderTemplate}
              className="button"
              style={{
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="fas fa-download"></i> Download Template
            </button>
          </div>
        </div>
      </div>

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1 className="page-title" style={{ margin: 0 }}>
          <i className="fas fa-box"></i> Products Management
        </h1>
        <button
          onClick={exportProductsToCSV}
          className="button"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className="fas fa-download"></i> Export to CSV
        </button>
      </div>

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

      {/* Import Products from CSV */}
      <div className="section">
        <h2 className="section-title">
          <i className="fas fa-upload"></i> Import Products from CSV
        </h2>
        <div className="card">
          <p style={{ marginBottom: "15px", color: "#6b7280" }}>
            Upload a CSV file with columns:{" "}
            <strong>
              name, stock, eanCode, description, category, supplier, price,
              minStock
            </strong>
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleProductFileUpload}
              id="product-csv-upload"
              style={{ display: "none" }}
            />
            <label
              htmlFor="product-csv-upload"
              className="button"
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="fas fa-file-csv"></i> Choose CSV File
            </label>
            <button
              onClick={downloadProductTemplate}
              className="button"
              style={{
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="fas fa-download"></i> Download Template
            </button>
          </div>
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
                    <td
                      onClick={() => viewProductDetails(product)}
                      style={{ cursor: "pointer" }}
                    >
                      {product.id}
                    </td>
                    <td
                      onClick={() => viewProductDetails(product)}
                      style={{ cursor: "pointer" }}
                    >
                      {product.name}
                    </td>
                    <td
                      onClick={() => viewProductDetails(product)}
                      style={{ cursor: "pointer" }}
                    >
                      {editingProductId === product.id ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
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
                    <td onClick={(e) => e.stopPropagation()}>
                      {editingProductId !== product.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProductId(product.id);
                            setEditingStock(product.stock);
                          }}
                          className="button"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                        >
                          <i className="fas fa-edit"></i> Quick Edit
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

  // Workers page
  const renderWorkersPage = () => (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1 className="page-title" style={{ margin: 0 }}>
          <i className="fas fa-users"></i> Workers Management
        </h1>
        <button
          onClick={() => setShowAddWorkerForm(!showAddWorkerForm)}
          className="button"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <i className={`fas fa-${showAddWorkerForm ? "times" : "plus"}`}></i>
          {showAddWorkerForm ? "Cancel" : "Add Worker"}
        </button>
      </div>

      {/* Add Worker Form */}
      {showAddWorkerForm && (
        <div className="section">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Add New Worker</h3>
            <form onSubmit={addWorker}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={newWorker.name}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, name: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newWorker.email}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, email: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newWorker.role}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, role: e.target.value })
                    }
                    className="form-input"
                  >
                    <option value="Picker">Picker</option>
                    <option value="Packer">Packer</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newWorker.phone}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, phone: e.target.value })
                    }
                    className="form-input"
                    placeholder="555-0100"
                  />
                </div>
              </div>
              <button type="submit" className="button">
                <i className="fas fa-save"></i> Add Worker
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Workers List */}
      <div className="section">
        <div className="card">
          {workers.length === 0 ? (
            <p className="empty-state">
              No workers yet. Add your first worker above!
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="table-row">
                    {editingWorker?.id === worker.id ? (
                      // Edit mode
                      <>
                        <td>{worker.id}</td>
                        <td>
                          <input
                            type="text"
                            value={editingWorker.name}
                            onChange={(e) =>
                              setEditingWorker({
                                ...editingWorker,
                                name: e.target.value,
                              })
                            }
                            className="form-input"
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            value={editingWorker.email}
                            onChange={(e) =>
                              setEditingWorker({
                                ...editingWorker,
                                email: e.target.value,
                              })
                            }
                            className="form-input"
                          />
                        </td>
                        <td>
                          <select
                            value={editingWorker.role}
                            onChange={(e) =>
                              setEditingWorker({
                                ...editingWorker,
                                role: e.target.value,
                              })
                            }
                            className="form-input"
                          >
                            <option value="Picker">Picker</option>
                            <option value="Packer">Packer</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Manager">Manager</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="tel"
                            value={editingWorker.phone}
                            onChange={(e) =>
                              setEditingWorker({
                                ...editingWorker,
                                phone: e.target.value,
                              })
                            }
                            className="form-input"
                          />
                        </td>
                        <td>
                          <span
                            className={`badge ${worker.active ? "badge-green" : "badge-orange"}`}
                          >
                            {worker.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button
                              onClick={() =>
                                updateWorker(worker.id, editingWorker)
                              }
                              className="button"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={() => setEditingWorker(null)}
                              className="button"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                backgroundColor: "#6b7280",
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td>{worker.id}</td>
                        <td>{worker.name}</td>
                        <td>{worker.email}</td>
                        <td>{worker.role}</td>
                        <td>{worker.phone || "-"}</td>
                        <td>
                          <span
                            className={`badge ${worker.active ? "badge-green" : "badge-orange"}`}
                          >
                            {worker.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button
                              onClick={() => setEditingWorker(worker)}
                              className="button"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() =>
                                toggleWorkerStatus(worker.id, worker.active)
                              }
                              className="button"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                backgroundColor: worker.active
                                  ? "#f59e0b"
                                  : "#10b981",
                              }}
                            >
                              <i
                                className={`fas fa-${worker.active ? "ban" : "check"}`}
                              ></i>
                            </button>
                            <button
                              onClick={() => deleteWorker(worker.id)}
                              className="button"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                backgroundColor: "#ef4444",
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );

  // Login/Register page
  const renderAuthPage = () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "#1f2937",
          }}
        >
          <i className="fas fa-warehouse"></i> OrderFlow
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "30px",
          }}
        >
          {showLoginForm ? "Welcome back!" : "Create your account"}
        </p>

        <form onSubmit={showLoginForm ? handleLogin : handleRegister}>
          {!showLoginForm && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Username
              </label>
              <input
                type="text"
                value={authForm.username}
                onChange={(e) =>
                  setAuthForm({ ...authForm, username: e.target.value })
                }
                required={!showLoginForm}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            {!showLoginForm && (
              <small style={{ color: "#6b7280" }}>Minimum 6 characters</small>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "15px",
            }}
          >
            {showLoginForm ? "Login" : "Register"}
          </button>

          <p
            style={{ textAlign: "center", color: "#6b7280", fontSize: "14px" }}
          >
            {showLoginForm
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => setShowLoginForm(!showLoginForm)}
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              {showLoginForm ? "Register" : "Login"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {!isAuthenticated ? (
        // Show login/register page if not authenticated
        renderAuthPage()
      ) : (
        <div className="app-layout">
          {/* Sidebar */}
          <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
              {!sidebarCollapsed && (
                <h2>
                  <i className="fas fa-warehouse"></i> OrderFlow
                </h2>
              )}
              {sidebarCollapsed && (
                <h2>
                  <i className="fas fa-warehouse"></i>
                </h2>
              )}
            </div>

            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <i
                className={`fas fa-${sidebarCollapsed ? "angle-right" : "angle-left"}`}
              ></i>
            </button>

            <nav className="sidebar-nav">
              <button
                className={`nav-item ${currentPage === "home" ? "active" : ""}`}
                onClick={() => setCurrentPage("home")}
                title="Home"
              >
                <i className="fas fa-home"></i>
                {!sidebarCollapsed && <span> Home</span>}
              </button>
              <button
                className={`nav-item ${currentPage === "orders" ? "active" : ""}`}
                onClick={() => setCurrentPage("orders")}
                title="Orders"
              >
                <i className="fas fa-clipboard-list"></i>
                {!sidebarCollapsed && <span> Orders</span>}
              </button>
              <button
                className={`nav-item ${currentPage === "products" ? "active" : ""}`}
                onClick={() => setCurrentPage("products")}
                title="Products"
              >
                <i className="fas fa-box"></i>
                {!sidebarCollapsed && <span> Products</span>}
              </button>
              <button
                className={`nav-item ${currentPage === "workers" ? "active" : ""}`}
                onClick={() => setCurrentPage("workers")}
                title="Workers"
              >
                <i className="fas fa-users"></i>
                {!sidebarCollapsed && <span> Workers</span>}
              </button>
              <button
                className="nav-item"
                onClick={handleLogout}
                title="Logout"
                style={{ marginTop: "auto", borderTop: "1px solid #374151" }}
              >
                <i className="fas fa-sign-out-alt"></i>
                {!sidebarCollapsed && <span> Logout</span>}
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div
            className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
          >
            {renderContent()}
            {/* Product Detail Modal */}
            {selectedProduct && (
              <div
                className="modal-overlay"
                onClick={() => setSelectedProduct(null)}
              >
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-header">
                    <h2>
                      <i className="fas fa-box"></i> Product Details
                    </h2>
                    <button
                      className="modal-close"
                      onClick={() => setSelectedProduct(null)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  <div className="modal-body">
                    {isEditingProduct ? (
                      // Edit Mode
                      <div className="product-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              <strong>Product Name</strong>
                            </label>
                            <input
                              type="text"
                              value={editProductForm.name}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  name: e.target.value,
                                })
                              }
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>
                              <strong>EAN Code</strong>
                            </label>
                            <input
                              type="text"
                              value={editProductForm.eanCode}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  eanCode: e.target.value,
                                })
                              }
                              className="form-input"
                              placeholder="e.g., 8712345678901"
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              <strong>Category</strong>
                            </label>
                            <input
                              type="text"
                              value={editProductForm.category}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  category: e.target.value,
                                })
                              }
                              className="form-input"
                              placeholder="e.g., Widgets"
                            />
                          </div>
                          <div className="form-group">
                            <label>
                              <strong>Supplier</strong>
                            </label>
                            <input
                              type="text"
                              value={editProductForm.supplier}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  supplier: e.target.value,
                                })
                              }
                              className="form-input"
                              placeholder="e.g., ABC Supplies"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>
                            <strong>Description</strong>
                          </label>
                          <textarea
                            value={editProductForm.description}
                            onChange={(e) =>
                              setEditProductForm({
                                ...editProductForm,
                                description: e.target.value,
                              })
                            }
                            className="form-input"
                            rows="3"
                            placeholder="Product description..."
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              <strong>Stock Level</strong>
                            </label>
                            <input
                              type="number"
                              value={editProductForm.stock}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  stock: e.target.value,
                                })
                              }
                              className="form-input"
                              min="0"
                            />
                          </div>
                          <div className="form-group">
                            <label>
                              <strong>Minimum Stock</strong>
                            </label>
                            <input
                              type="number"
                              value={editProductForm.minStock}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  minStock: e.target.value,
                                })
                              }
                              className="form-input"
                              min="0"
                            />
                          </div>
                          <div className="form-group">
                            <label>
                              <strong>Price</strong>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editProductForm.price}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  price: e.target.value,
                                })
                              }
                              className="form-input"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="modal-actions">
                          <button
                            onClick={saveProductChanges}
                            className="button"
                            style={{ marginRight: "10px" }}
                          >
                            <i className="fas fa-save"></i> Save Changes
                          </button>
                          <button
                            onClick={() => setIsEditingProduct(false)}
                            className="button"
                            style={{ backgroundColor: "#6b7280" }}
                          >
                            <i className="fas fa-times"></i> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="product-details">
                        <div className="detail-section">
                          <h3>Basic Information</h3>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <label>Product ID:</label>
                              <span>#{selectedProduct.id}</span>
                            </div>
                            <div className="detail-item">
                              <label>Product Name:</label>
                              <span>{selectedProduct.name}</span>
                            </div>
                            <div className="detail-item">
                              <label>EAN Code:</label>
                              <span>
                                {selectedProduct.eanCode || "Not set"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Category:</label>
                              <span>
                                {selectedProduct.category || "Not set"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h3>Description</h3>
                          <p>
                            {selectedProduct.description ||
                              "No description available"}
                          </p>
                        </div>

                        <div className="detail-section">
                          <h3>Inventory & Pricing</h3>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <label>Current Stock:</label>
                              <span
                                className={`badge ${selectedProduct.stock > 50 ? "badge-green" : "badge-orange"}`}
                              >
                                {selectedProduct.stock} units
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Minimum Stock:</label>
                              <span>{selectedProduct.minStock || 0} units</span>
                            </div>
                            <div className="detail-item">
                              <label>Price:</label>
                              <span>
                                $
                                {selectedProduct.price
                                  ? selectedProduct.price.toFixed(2)
                                  : "0.00"}
                              </span>
                            </div>
                            <div className="detail-item">
                              <label>Supplier:</label>
                              <span>
                                {selectedProduct.supplier || "Not set"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="modal-actions">
                          <button
                            onClick={startEditingProduct}
                            className="button"
                          >
                            <i className="fas fa-edit"></i> Edit Product
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
