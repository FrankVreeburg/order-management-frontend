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
    userId: null,
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
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showAddOrderForm, setShowAddOrderForm] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: "",
    items: [{ productId: "", quantity: "" }], // Array of items
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editOrderItems, setEditOrderItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemQuantity, setEditingItemQuantity] = useState("");
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemToAdd, setNewItemToAdd] = useState({
    productId: "",
    quantity: "",
  });
  const [settingsActiveTab, setSettingsActiveTab] = useState("branding");
  const [tempSettings, setTempSettings] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch all data in parallel instead of sequentially
      Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchWorkers(),
        fetchCustomers(),
        fetchUsers(),
        fetchSettings(),
      ]).catch((error) => {
        console.error("Error loading initial data:", error);
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setTempSettings({ ...settings });
  }, [settings]);

  // Apply settings to CSS variables (add this with your other useEffects)
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      // Apply color settings as CSS variables
      const root = document.documentElement;

      root.style.setProperty(
        "--color-primary",
        settings.color_primary || "#3b82f6",
      );
      root.style.setProperty(
        "--color-secondary",
        settings.color_secondary || "#1e40af",
      );
      root.style.setProperty(
        "--color-sidebar",
        settings.color_sidebar || "#1f2937",
      );
      root.style.setProperty(
        "--color-sidebar-text",
        settings.color_sidebar_text || "#ffffff",
      );
      root.style.setProperty(
        "--color-success",
        settings.color_success || "#10b981",
      );
      root.style.setProperty(
        "--color-warning",
        settings.color_warning || "#f59e0b",
      );
      root.style.setProperty(
        "--color-danger",
        settings.color_danger || "#ef4444",
      );

      // Apply company name to page title
      document.title = settings.company_name || "OrderFlow";
    }
  }, [settings]);

  // Helper function to make authenticated API requests
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      // If no token, redirect to login
      setIsAuthenticated(false);
      throw new Error("No authentication token");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // If token is invalid (401 or 403), log out
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("authToken");
      setIsAuthenticated(false);
      setCurrentUser(null);
      alert("Session expired. Please log in again.");
      throw new Error("Authentication failed");
    }

    return response;
  };

  const fetchProducts = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:3000/products");
      const data = await response.json();
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
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:3000/orders");
      const data = await response.json();
      const convertedData = data.map((order) => ({
        id: order.id,
        customerId: parseInt(order.customer_id) || 0,
        customerName: order.customer_name || "",
        customerEmail: order.customer_email || "",
        customerCompany: order.customer_company || "",
        status: order.status || "pending",
        createdAt: order.created_at || new Date(),
        assignedPickerId: order.assigned_picker_id || null,
        assignedPackerId: order.assigned_packer_id || null,
        pickerName: order.picker_name || null,
        packerName: order.packer_name || null,
        pickedAt: order.picked_at || null,
        packedAt: order.packed_at || null,
        shippedAt: order.shipped_at || null,
        items: order.items.map((item) => ({
          id: item.id,
          productId: parseInt(item.product_id) || 0,
          productName: item.product_name || "",
          quantity: parseInt(item.quantity) || 0,
          priceAtOrder: parseFloat(item.price_at_order) || 0,
          createdAt: item.created_at || new Date(),
        })),
      }));
      setOrders(convertedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:3000/workers");
      const data = await response.json();
      const convertedData = data.map((worker) => ({
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: worker.role,
        phone: worker.phone,
        active: worker.active === true || worker.active === "true",
        userId: worker.user_id || null, // Convert user_id to userId
        username: worker.username || null, // From the JOIN
        userEmail: worker.user_email || null, // From the JOIN
      }));
      setWorkers(convertedData);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:3000/customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchCustomerOrders = async (customerId) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/customers/${customerId}/orders`,
      );
      const data = await response.json();

      // Convert orders to frontend format
      const convertedOrders = data.orders.map((order) => ({
        id: order.id,
        customerId: parseInt(order.customer_id) || 0,
        customerName: order.customer_name || "",
        status: order.status || "pending",
        createdAt: order.created_at || new Date(),
        items: order.items.map((item) => ({
          id: item.id,
          productId: parseInt(item.product_id) || 0,
          productName: item.product_name || "",
          quantity: parseInt(item.quantity) || 0,
          priceAtOrder: parseFloat(item.price_at_order) || 0,
        })),
      }));

      setCustomerOrders(convertedOrders);
      setSelectedCustomer(data.customer);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      alert("Failed to fetch customer orders");
    }
  };

  // Fetch single order with full details
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/orders/${orderId}`,
      );
      const data = await response.json();

      const convertedOrder = {
        id: data.id,
        customerId: parseInt(data.customer_id) || 0,
        customerName: data.customer_name || "",
        customerEmail: data.customer_email || "",
        customerCompany: data.customer_company || "",
        customerPhone: data.customer_phone || "",
        customerAddress: data.customer_address || "",
        status: data.status || "pending",
        createdAt: data.created_at || new Date(),
        assignedPickerId: data.assigned_picker_id || null,
        assignedPackerId: data.assigned_packer_id || null,
        pickerName: data.picker_name || null,
        pickerEmail: data.picker_email || null,
        packerName: data.packer_name || null,
        packerEmail: data.packer_email || null,
        pickedAt: data.picked_at || null,
        packedAt: data.packed_at || null,
        shippedAt: data.shipped_at || null,
        items: data.items.map((item) => ({
          id: item.id,
          productId: parseInt(item.product_id) || 0,
          productName: item.product_name || "",
          quantity: parseInt(item.quantity) || 0,
          priceAtOrder: parseFloat(item.price_at_order) || 0,
        })),
      };

      setSelectedOrder(convertedOrder);
      setEditOrderItems([...convertedOrder.items]);
      setIsEditingOrder(false);
    } catch (error) {
      console.error("Error fetching order details:", error);
      alert("Failed to fetch order details");
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/orders/${orderId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();

      const convertedOrder = {
        id: data.id,
        customerId: parseInt(data.customer_id) || 0,
        customerName: data.customer_name || "",
        status: data.status || "pending",
        createdAt: data.created_at || new Date(),
        assignedPickerId: data.assigned_picker_id || null,
        assignedPackerId: data.assigned_packer_id || null,
        pickerName: data.picker_name || null,
        packerName: data.packer_name || null,
        pickedAt: data.picked_at || null,
        packedAt: data.packed_at || null,
        shippedAt: data.shipped_at || null,
        items: data.items.map((item) => ({
          id: item.id,
          productId: parseInt(item.product_id) || 0,
          productName: item.product_name || "",
          quantity: parseInt(item.quantity) || 0,
          priceAtOrder: parseFloat(item.price_at_order) || 0,
        })),
      };

      // Update in orders list
      setOrders(orders.map((o) => (o.id === orderId ? convertedOrder : o)));

      // Update selected order if it's open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(convertedOrder);
        setEditOrderItems([...convertedOrder.items]);
      }

      alert(`Order #${orderId} status updated to "${newStatus}"!`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  // Assign worker to order
  const assignWorker = async (orderId, role, workerId) => {
    try {
      const field = role === "picker" ? "assignedPickerId" : "assignedPackerId";

      const response = await fetchWithAuth(
        `http://localhost:3000/orders/${orderId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ [field]: workerId }),
        },
      );

      const data = await response.json();

      const convertedOrder = {
        id: data.id,
        customerId: parseInt(data.customer_id) || 0,
        customerName: data.customer_name || "",
        status: data.status || "pending",
        createdAt: data.created_at || new Date(),
        assignedPickerId: data.assigned_picker_id || null,
        assignedPackerId: data.assigned_packer_id || null,
        pickerName: data.picker_name || null,
        packerName: data.packer_name || null,
        pickedAt: data.picked_at || null,
        packedAt: data.packed_at || null,
        shippedAt: data.shipped_at || null,
        items: data.items.map((item) => ({
          id: item.id,
          productId: parseInt(item.product_id) || 0,
          productName: item.product_name || "",
          quantity: parseInt(item.quantity) || 0,
          priceAtOrder: parseFloat(item.price_at_order) || 0,
        })),
      };

      setOrders(orders.map((o) => (o.id === orderId ? convertedOrder : o)));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(convertedOrder);
      }

      const workerName =
        workers.find((w) => w.id === workerId)?.name || "Worker";
      alert(`${workerName} assigned as ${role}!`);
    } catch (error) {
      console.error("Error assigning worker:", error);
      alert("Failed to assign worker");
    }
  };

  const fetchUsers = async () => {
    // Only fetch if user is admin
    if (currentUser?.role !== "admin") return;

    try {
      const response = await fetchWithAuth("http://localhost:3000/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch all settings
  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await fetchWithAuth("http://localhost:3000/settings");
      const data = await response.json();

      // Convert to simple key-value format
      const settingsMap = {};
      Object.keys(data).forEach((key) => {
        settingsMap[key] = data[key].value;
      });

      setSettings(settingsMap);
      setIsLoadingSettings(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setIsLoadingSettings(false);
    }
  };

  // Update settings
  const updateSettings = async (updatedSettings) => {
    try {
      const response = await fetchWithAuth("http://localhost:3000/settings", {
        method: "PATCH",
        body: JSON.stringify({ settings: updatedSettings }),
      });

      const data = await response.json();

      // Refresh settings
      await fetchSettings();

      alert("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings");
    }
  };

  // Upload logo
  const uploadLogo = async (file) => {
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/settings/logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Refresh settings to get new logo URL
      await fetchSettings();

      alert("Logo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo");
    }
  };

  // Delete logo
  const deleteLogo = async () => {
    if (!window.confirm("Are you sure you want to remove the logo?")) {
      return;
    }

    try {
      await fetchWithAuth("http://localhost:3000/settings/logo", {
        method: "DELETE",
      });

      // Refresh settings
      await fetchSettings();

      alert("Logo removed successfully!");
    } catch (error) {
      console.error("Error deleting logo:", error);
      alert("Failed to delete logo");
    }
  };

  const addCustomer = async (e) => {
    e.preventDefault();

    if (!newCustomer.name) {
      alert("Customer name is required");
      return;
    }

    try {
      const response = await fetchWithAuth("http://localhost:3000/customers", {
        method: "POST",
        body: JSON.stringify(newCustomer),
      });
      const customer = await response.json();
      setCustomers([...customers, customer]);
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
      });
      setShowAddCustomerForm(false);
      alert(`Customer "${customer.name}" added successfully!`);
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer");
    }
  };

  const updateCustomer = async (customerId, updates) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/customers/${customerId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updates),
        },
      );
      const updatedCustomer = await response.json();
      setCustomers(
        customers.map((c) => (c.id === customerId ? updatedCustomer : c)),
      );
      setEditingCustomer(null);
      alert("Customer updated successfully!");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Failed to update customer");
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/users/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify(updates),
        },
      );
      const updatedUser = await response.json();
      setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await fetchWithAuth(`http://localhost:3000/users/${userId}`, {
        method: "DELETE",
      });
      setUsers(users.filter((u) => u.id !== userId));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const processOrder = async (orderId) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/orders/${orderId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "processed" }),
        },
      );
      const updatedOrder = await response.json();

      // Convert database format to frontend format (same as in fetchOrders)
      const convertedOrder = {
        id: updatedOrder.id,
        customerId: parseInt(updatedOrder.customer_id) || 0,
        customerName: updatedOrder.customer_name || "",
        customerEmail: updatedOrder.customer_email || "",
        customerCompany: updatedOrder.customer_company || "",
        status: updatedOrder.status || "pending",
        createdAt: updatedOrder.created_at || new Date(),
        items: (updatedOrder.items || []).map((item) => ({
          id: item.id,
          productId: parseInt(item.product_id) || 0,
          productName: item.product_name || "",
          quantity: parseInt(item.quantity) || 0,
          priceAtOrder: parseFloat(item.price_at_order) || 0,
        })),
      };

      setOrders(
        orders.map((order) => (order.id === orderId ? convertedOrder : order)),
      );
      alert(`Order #${orderId} processed successfully!`);
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Failed to process order");
    }
  };

  // Add helper functions to manage order items
  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { productId: "", quantity: "" }],
    });
  };

  // Add item to existing order
  const addItemToOrder = async (orderId, productId, quantity) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/orders/${orderId}/items`,
        {
          method: "POST",
          body: JSON.stringify({
            productId: parseInt(productId),
            quantity: parseInt(quantity),
          }),
        },
      );

      const newItem = await response.json();

      // Convert to frontend format
      const convertedItem = {
        id: newItem.id,
        productId: parseInt(newItem.product_id) || 0,
        productName: newItem.product_name || "",
        quantity: parseInt(newItem.quantity) || 0,
        priceAtOrder: parseFloat(newItem.price_at_order) || 0,
      };

      // Update selected order
      setSelectedOrder({
        ...selectedOrder,
        items: [...selectedOrder.items, convertedItem],
      });

      // Update in orders list
      setOrders(
        orders.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              items: [...o.items, convertedItem],
            };
          }
          return o;
        }),
      );

      alert("Item added successfully!");
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
    }
  };

  // Update order item quantity
  const updateOrderItem = async (orderId, itemId, newQuantity) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/orders/${orderId}/items/${itemId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ quantity: parseInt(newQuantity) }),
        },
      );

      const updatedItem = await response.json();

      // Convert to frontend format
      const convertedItem = {
        id: updatedItem.id,
        productId: parseInt(updatedItem.product_id) || 0,
        productName: updatedItem.product_name || "",
        quantity: parseInt(updatedItem.quantity) || 0,
        priceAtOrder: parseFloat(updatedItem.price_at_order) || 0,
      };

      // Update selected order
      setSelectedOrder({
        ...selectedOrder,
        items: selectedOrder.items.map((item) =>
          item.id === itemId ? convertedItem : item,
        ),
      });

      // Update in orders list
      setOrders(
        orders.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              items: o.items.map((item) =>
                item.id === itemId ? convertedItem : item,
              ),
            };
          }
          return o;
        }),
      );

      alert("Item updated successfully!");
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item");
    }
  };

  // Remove item from order
  const removeOrderItem = async (orderId, itemId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) {
      return;
    }

    try {
      await fetchWithAuth(
        `http://localhost:3000/orders/${orderId}/items/${itemId}`,
        {
          method: "DELETE",
        },
      );

      // Update selected order
      setSelectedOrder({
        ...selectedOrder,
        items: selectedOrder.items.filter((item) => item.id !== itemId),
      });

      // Update in orders list
      setOrders(
        orders.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              items: o.items.filter((item) => item.id !== itemId),
            };
          }
          return o;
        }),
      );

      alert("Item removed successfully!");
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item");
    }
  };

  const addOrder = async (e) => {
    e.preventDefault();

    if (!newOrder.customerId) {
      alert("Customer is required");
      return;
    }

    // Validate items
    const validItems = newOrder.items.filter(
      (item) => item.productId && item.quantity > 0,
    );
    if (validItems.length === 0) {
      alert("At least one item with product and quantity is required");
      return;
    }

    try {
      const response = await fetchWithAuth("http://localhost:3000/orders", {
        method: "POST",
        body: JSON.stringify({
          customerId: parseInt(newOrder.customerId),
          items: validItems.map((item) => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
          })),
        }),
      });

      const order = await response.json();

      // Convert database format to frontend format
      const convertedOrder = {
        id: order.id,
        customerId: parseInt(order.customer_id) || 0,
        customerName: order.customer_name || "",
        status: order.status || "pending",
        createdAt: order.created_at || new Date(),
        items: order.items.map((item) => ({
          id: item.id,
          productId: parseInt(item.product_id) || 0,
          productName: item.product_name || "",
          quantity: parseInt(item.quantity) || 0,
          priceAtOrder: parseFloat(item.price_at_order) || 0,
        })),
      };

      setOrders([convertedOrder, ...orders]);
      setNewOrder({ customerId: "", items: [{ productId: "", quantity: "" }] });
      setShowAddOrderForm(false);
      alert(
        `Order #${convertedOrder.id} created successfully with ${convertedOrder.items.length} item(s)!`,
      );
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Check console for details.");
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();

    if (!newProductName || !newProductStock) {
      alert("Please fill in all fields and stock");
      return;
    }

    try {
      const response = await fetchWithAuth("http://localhost:3000/products", {
        method: "POST",
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
      });
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      setNewProductName("");
      setNewProductStock("");
      alert(`Product "${newProduct.name}" added successfully!`);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    }
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

  const saveProductChanges = async () => {
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

    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/products/${selectedProduct.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(dataToSend),
        },
      );
      const updatedProduct = await response.json();

      const converted = {
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

      setProducts(products.map((p) => (p.id === converted.id ? converted : p)));
      setSelectedProduct(converted);
      setIsEditingProduct(false);
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    }
  };

  const updateProductStock = async (productId) => {
    if (!editingStock || editingStock < 0) {
      alert("Please enter a valid stock amount");
      return;
    }

    try {
      const response = await fetchWithAuth(
        `http://localhost:3000/products/${productId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ stock: parseInt(editingStock) }),
        },
      );
      const updatedProduct = await response.json();

      // Convert database format to frontend format
      const convertedProduct = {
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
        products.map((product) =>
          product.id === productId ? convertedProduct : product,
        ),
      );
      setEditingProductId(null);
      setEditingStock("");
      alert(`Stock updated successfully!`);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update stock");
    }
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

    const importNext = async (index) => {
      if (index >= productsToImport.length) {
        alert(`Import complete!\nSuccessful: ${imported}\nFailed: ${failed}`);
        fetchProducts();
        return;
      }

      try {
        await fetchWithAuth("http://localhost:3000/products", {
          method: "POST",
          body: JSON.stringify(productsToImport[index]),
        });
        imported++;
      } catch (error) {
        console.error("Error importing product:", error);
        failed++;
      }

      importNext(index + 1);
    };

    importNext(0);
  };

  const downloadOrderTemplate = () => {
    const headers = ["productId", "quantity", "customerId"];
    const exampleRow = ["1", "10", "1"];

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
    const requiredHeaders = ["productId", "quantity", "customerId"];

    // Check if required headers exist
    const hasRequired = requiredHeaders.every((h) => headers.includes(h));
    if (!hasRequired) {
      alert('CSV must have "productId", "quantity", and "customerId" columns');
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
      if (!order.productId || !order.quantity || !order.customerId) {
        console.warn(`Skipping row ${i + 1}: missing required fields`);
        continue;
      }

      ordersToImport.push({
        productId: parseInt(order.productId),
        quantity: parseInt(order.quantity),
        customerId: parseInt(order.customerId),
      });
    }

    if (ordersToImport.length === 0) {
      alert("No valid orders found in CSV");
      return;
    }

    // Import orders one by one
    let imported = 0;
    let failed = 0;

    const importNext = async (index) => {
      if (index >= ordersToImport.length) {
        alert(`Import complete!\nSuccessful: ${imported}\nFailed: ${failed}`);
        fetchOrders();
        return;
      }

      try {
        await fetchWithAuth("http://localhost:3000/orders", {
          method: "POST",
          body: JSON.stringify(ordersToImport[index]),
        });
        imported++;
      } catch (error) {
        console.error("Error importing order:", error);
        failed++;
      }

      importNext(index + 1);
    };

    importNext(0);
  };

  const addWorker = async (e) => {
    e.preventDefault();

    if (!newWorker.name || !newWorker.email) {
      alert("Name and email are required");
      return;
    }

    try {
      const response = await fetchWithAuth("http://localhost:3000/workers", {
        method: "POST",
        body: JSON.stringify({
          ...newWorker,
          userId: newWorker.userId ? parseInt(newWorker.userId) : null,
        }),
      });
      const worker = await response.json();

      // Convert database format to frontend format
      const convertedWorker = {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: worker.role,
        phone: worker.phone,
        active: worker.active === true || worker.active === "true",
        userId: worker.user_id || null,
        username: worker.username || null,
        userEmail: worker.user_email || null,
      };

      setWorkers([...workers, convertedWorker]);
      setNewWorker({
        name: "",
        email: "",
        role: "Picker",
        phone: "",
        userId: null,
      });
      setShowAddWorkerForm(false);
      alert(`Worker "${convertedWorker.name}" added successfully!`);

      // Refresh users list if a user was linked
      if (newWorker.userId) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error adding worker:", error);
      alert("Failed to add worker");
    }
  };

  const updateWorker = async (workerId, updates) => {
    try {
      // Convert userId to user_id for backend
      const backendUpdates = { ...updates };
      if ("userId" in backendUpdates) {
        backendUpdates.userId = backendUpdates.userId
          ? parseInt(backendUpdates.userId)
          : null;
      }

      const response = await fetchWithAuth(
        `http://localhost:3000/workers/${workerId}`,
        {
          method: "PATCH",
          body: JSON.stringify(backendUpdates),
        },
      );
      const updatedWorker = await response.json();

      // Convert database format to frontend format
      const convertedWorker = {
        id: updatedWorker.id,
        name: updatedWorker.name,
        email: updatedWorker.email,
        role: updatedWorker.role,
        phone: updatedWorker.phone,
        active:
          updatedWorker.active === true || updatedWorker.active === "true",
        userId: updatedWorker.user_id || null,
        username: updatedWorker.username || null,
        userEmail: updatedWorker.user_email || null,
      };

      setWorkers(workers.map((w) => (w.id === workerId ? convertedWorker : w)));
      setEditingWorker(null);
      alert("Worker updated successfully!");

      // Refresh users list if user linkage was changed
      if ("userId" in backendUpdates) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating worker:", error);
      alert("Failed to update worker");
    }
  };

  const deleteWorker = async (workerId) => {
    if (!window.confirm("Are you sure you want to delete this worker?")) {
      return;
    }

    try {
      await fetchWithAuth(`http://localhost:3000/workers/${workerId}`, {
        method: "DELETE",
      });
      setWorkers(workers.filter((w) => w.id !== workerId));
      alert("Worker deleted successfully!");
    } catch (error) {
      console.error("Error deleting worker:", error);
      alert("Failed to delete worker");
    }
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
      case "customers":
        return renderCustomersPage();
      case "users":
        return renderUsersPage();
      case "settings":
        return renderSettingsPage();
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
      labels: ["Pending", "Picked", "Packed", "Shipped", "Processed"],
      datasets: [
        {
          label: "Orders",
          data: [
            orders.filter((o) => o.status === "pending").length,
            orders.filter((o) => o.status === "picked").length,
            orders.filter((o) => o.status === "packed").length,
            orders.filter((o) => o.status === "shipped").length,
            orders.filter((o) => o.status === "processed").length,
          ],
          backgroundColor: [
            "#f59e0b",
            "#3b82f6",
            "#8b5cf6",
            "#10b981",
            "#059669",
          ],
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

        {/* Stats Cards - Now Clickable! */}
        <div className="stats-grid">
          <div
            className="stat-card stat-card-clickable"
            onClick={() => setCurrentPage("products")}
            title="Click to view Products page"
          >
            <div className="stat-icon">
              <i className="fas fa-box" style={{ color: "#3b82f6" }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalProducts}</div>
              <div className="stat-label">Total Products</div>
            </div>
          </div>
          <div
            className="stat-card stat-card-clickable"
            onClick={() => setCurrentPage("orders")}
            title="Click to view Orders page"
          >
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
          <div
            className="stat-card stat-card-clickable"
            onClick={() => {
              setCurrentPage("orders");
              setOrderFilter("pending");
            }}
            title="Click to view Pending Orders"
          >
            <div className="stat-icon">
              <i className="fas fa-clock" style={{ color: "#f59e0b" }}></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{pendingOrders}</div>
              <div className="stat-label">Pending Orders</div>
            </div>
          </div>
          <div
            className="stat-card stat-card-clickable"
            onClick={() => setCurrentPage("workers")}
            title="Click to view Workers page"
          >
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
            <div className="card alert-card">
              <p className="alert-card-title">
                The following products need restocking:
              </p>
              <ul className="alert-card-list">
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
            <div className="chart-container">
              <Doughnut data={orderStatusData} options={chartOptions} />
            </div>
          </div>

          {/* Stock Levels Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <i className="fas fa-chart-bar"></i> Product Stock Levels
            </h3>
            <div className="chart-container">
              <Bar data={stockData} options={chartOptions} />
            </div>
          </div>

          {/* Orders Trend Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <i className="fas fa-chart-line"></i> Orders Trend (Last 7 Days)
            </h3>
            <div className="chart-container">
              <Line data={orderTrendData} options={chartOptions} />
            </div>
          </div>

          {/* Workers by Role Chart */}
          <div className="chart-card">
            <h3 className="chart-title">
              <i className="fas fa-users-cog"></i> Workers by Role
            </h3>
            <div className="chart-container">
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
                    <th>Items</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .slice(-10)
                    .reverse()
                    .map((order) => (
                      <tr key={order.id} className="table-row">
                        <td>#{order.id}</td>
                        <td>{order.customerName}</td>
                        <td>
                          {order.items && order.items.length > 0 ? (
                            <div className="item-list">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="item-list-item">
                                  {item.productName} (×{item.quantity})
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="item-list-item">
                                  +{order.items.length - 2} more...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#6b7280" }}>No items</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              order.status === "pending"
                                ? "badge-orange"
                                : order.status === "picked"
                                  ? "badge-blue"
                                  : order.status === "packed"
                                    ? "badge-purple"
                                    : order.status === "shipped"
                                      ? "badge-green"
                                      : "badge-green"
                            }`}
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
      <div className="page-header">
        <h1 className="page-header-title">
          <i className="fas fa-clipboard-list"></i> Orders Management
        </h1>
        <div className="page-header-actions">
          <button onClick={exportOrdersToCSV} className="button">
            <i className="fas fa-download"></i> Export to CSV
          </button>
          <button
            onClick={() => setShowAddOrderForm(!showAddOrderForm)}
            className="button"
          >
            <i className={`fas fa-${showAddOrderForm ? "times" : "plus"}`}></i>
            {showAddOrderForm ? "Cancel" : "Create Order"}
          </button>
        </div>
      </div>

      {/* Add Order Form */}
      {showAddOrderForm && (
        <div className="section">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Create New Order</h3>
            <form onSubmit={addOrder}>
              <div className="form-group">
                <label>Customer *</label>
                <select
                  value={newOrder.customerId}
                  onChange={(e) =>
                    setNewOrder({ ...newOrder, customerId: e.target.value })
                  }
                  className="form-input"
                  required
                >
                  <option value="">Select a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}{" "}
                      {customer.company && `(${customer.company})`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: "20px", marginBottom: "10px" }}>
                <label className="order-item-label">
                  <span>Order Items *</span>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="button button-small"
                  >
                    <i className="fas fa-plus"></i> Add Item
                  </button>
                </label>
              </div>

              {newOrder.items.map((item, index) => (
                <div key={index} className="order-item-row">
                  <div style={{ flex: 2 }}>
                    <label className="order-item-label">Product</label>
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        updateOrderItem(index, "productId", e.target.value)
                      }
                      className="form-input"
                      required
                    >
                      <option value="">Select a product...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {product.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="order-item-label">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateOrderItem(index, "quantity", e.target.value)
                      }
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>
                  {newOrder.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="button button-danger"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              ))}

              <div className="button-group" style={{ marginTop: "20px" }}>
                <button type="submit" className="button">
                  <i className="fas fa-save"></i> Create Order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddOrderForm(false);
                    setNewOrder({
                      customerId: "",
                      items: [{ productId: "", quantity: "" }],
                    });
                  }}
                  className="button button-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Orders from CSV */}
      <div className="section">
        <h2 className="section-title">
          <i className="fas fa-upload"></i> Import Orders from CSV
        </h2>
        <div className="card">
          <p className="form-help-text" style={{ marginBottom: "15px" }}>
            Upload a CSV file with columns:{" "}
            <strong>productId, quantity, customerName</strong>
          </p>
          <div className="button-group">
            <input
              type="file"
              accept=".csv"
              onChange={handleOrderFileUpload}
              id="order-csv-upload"
              className="file-upload-hidden"
            />
            <label
              htmlFor="order-csv-upload"
              className="button file-upload-label"
            >
              <i className="fas fa-file-csv"></i> Choose CSV File
            </label>
            <button
              onClick={downloadOrderTemplate}
              className="button button-success"
            >
              <i className="fas fa-download"></i> Download Template
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card">
          <p className="info-box">
            <i className="fas fa-info-circle"></i>
            Click on any order to view full details and manage items
          </p>

          {/* Filter buttons */}
          <div className="filter-buttons">
            <button
              onClick={() => setOrderFilter("all")}
              className={`button ${orderFilter === "all" ? "" : "button-secondary"}`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setOrderFilter("pending")}
              className={`button ${orderFilter === "pending" ? "" : "button-secondary"}`}
            >
              Pending ({orders.filter((o) => o.status === "pending").length})
            </button>
            <button
              onClick={() => setOrderFilter("picked")}
              className={`button ${orderFilter === "picked" ? "" : "button-secondary"}`}
            >
              Picked ({orders.filter((o) => o.status === "picked").length})
            </button>
            <button
              onClick={() => setOrderFilter("packed")}
              className={`button ${orderFilter === "packed" ? "" : "button-secondary"}`}
            >
              Packed ({orders.filter((o) => o.status === "packed").length})
            </button>
            <button
              onClick={() => setOrderFilter("shipped")}
              className={`button ${orderFilter === "shipped" ? "" : "button-secondary"}`}
            >
              Shipped ({orders.filter((o) => o.status === "shipped").length})
            </button>
            <button
              onClick={() => setOrderFilter("processed")}
              className={`button ${orderFilter === "processed" ? "" : "button-secondary"}`}
            >
              Processed ({orders.filter((o) => o.status === "processed").length}
              )
            </button>
          </div>

          {/* Search bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search orders by customer or product name..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="search-input"
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
                  <th>Items</th>
                  <th>Total Quantity</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {getSearchedAndFilteredOrders().map((order) => (
                  <tr
                    key={order.id}
                    className="table-row table-row-clickable"
                    onClick={() => fetchOrderDetails(order.id)}
                  >
                    <td>#{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>
                      {order.items.length > 0 ? (
                        <div className="item-list">
                          {order.items.map((item) => (
                            <div key={item.id} className="item-list-item">
                              {item.productName} (×{item.quantity})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#6b7280" }}>No items</span>
                      )}
                    </td>
                    <td>
                      {order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                      )}{" "}
                      units
                    </td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge ${
                          order.status === "pending"
                            ? "badge-orange"
                            : order.status === "picked"
                              ? "badge-blue"
                              : order.status === "packed"
                                ? "badge-purple"
                                : order.status === "shipped"
                                  ? "badge-green"
                                  : "badge-orange"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {order.status === "pending" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "picked")}
                          className="button button-small"
                        >
                          Mark Picked
                        </button>
                      )}
                      {order.status === "picked" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "packed")}
                          className="button button-small"
                        >
                          Mark Packed
                        </button>
                      )}
                      {order.status === "packed" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "shipped")}
                          className="button button-small"
                        >
                          Mark Shipped
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedOrder(null);
            setIsEditingOrder(false);
            setEditOrderItems([]);
            setEditingItemId(null);
            setEditingItemQuantity("");
            setShowAddItemForm(false);
            setNewItemToAdd({ productId: "", quantity: "" });
          }}
        >
          <div
            className="modal-content modal-content-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                <i className="fas fa-file-invoice"></i> Order #
                {selectedOrder.id}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  setSelectedOrder(null);
                  setIsEditingOrder(false);
                  setEditOrderItems([]);
                  setEditingItemId(null);
                  setEditingItemQuantity("");
                  setShowAddItemForm(false);
                  setNewItemToAdd({ productId: "", quantity: "" });
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Order Status & Progress */}
              <div className="detail-section">
                <h3>Order Status</h3>
                <div className="status-timeline">
                  <span
                    className={`badge ${
                      selectedOrder.status === "pending"
                        ? "badge-orange"
                        : selectedOrder.status === "picked"
                          ? "badge-blue"
                          : selectedOrder.status === "packed"
                            ? "badge-purple"
                            : selectedOrder.status === "shipped"
                              ? "badge-green"
                              : "badge-orange"
                    }`}
                    style={{ fontSize: "16px", padding: "8px 16px" }}
                  >
                    <i
                      className={`fas fa-${
                        selectedOrder.status === "pending"
                          ? "clock"
                          : selectedOrder.status === "picked"
                            ? "check"
                            : selectedOrder.status === "packed"
                              ? "box"
                              : selectedOrder.status === "shipped"
                                ? "truck"
                                : "clock"
                      }`}
                    ></i>{" "}
                    {selectedOrder.status.toUpperCase()}
                  </span>

                  {/* Status progression buttons */}
                  {selectedOrder.status === "pending" && (
                    <button
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, "picked")
                      }
                      className="button"
                    >
                      <i className="fas fa-arrow-right"></i> Mark as Picked
                    </button>
                  )}
                  {selectedOrder.status === "picked" && (
                    <button
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, "packed")
                      }
                      className="button"
                    >
                      <i className="fas fa-arrow-right"></i> Mark as Packed
                    </button>
                  )}
                  {selectedOrder.status === "packed" && (
                    <button
                      onClick={() =>
                        updateOrderStatus(selectedOrder.id, "shipped")
                      }
                      className="button"
                    >
                      <i className="fas fa-arrow-right"></i> Mark as Shipped
                    </button>
                  )}
                </div>

                {/* Timeline */}
                <div className="status-dates">
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                  {selectedOrder.pickedAt && (
                    <div>
                      <strong>Picked:</strong>{" "}
                      {new Date(selectedOrder.pickedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedOrder.packedAt && (
                    <div>
                      <strong>Packed:</strong>{" "}
                      {new Date(selectedOrder.packedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedOrder.shippedAt && (
                    <div>
                      <strong>Shipped:</strong>{" "}
                      {new Date(selectedOrder.shippedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedOrder.customerEmail || "Not provided"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Company:</label>
                    <span>
                      {selectedOrder.customerCompany || "Not provided"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedOrder.customerPhone || "Not provided"}</span>
                  </div>
                  {selectedOrder.customerAddress && (
                    <div className="detail-item detail-grid-full">
                      <label>Address:</label>
                      <span>{selectedOrder.customerAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Worker Assignments */}
              <div className="detail-section">
                <h3>Worker Assignments</h3>
                <div className="form-row-2">
                  {/* Picker Assignment */}
                  <div>
                    <label className="form-group label">
                      <i className="fas fa-hand-pointer"></i> Assigned Picker
                    </label>
                    {selectedOrder.status === "pending" ? (
                      <select
                        value={selectedOrder.assignedPickerId || ""}
                        onChange={(e) =>
                          assignWorker(
                            selectedOrder.id,
                            "picker",
                            parseInt(e.target.value) || null,
                          )
                        }
                        className="form-input"
                      >
                        <option value="">No picker assigned</option>
                        {workers
                          .filter(
                            (w) =>
                              w.active &&
                              (w.role === "Picker" ||
                                w.role === "Supervisor" ||
                                w.role === "Manager"),
                          )
                          .map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="detail-item-box">
                        {selectedOrder.pickerName || "No picker assigned"}
                      </div>
                    )}
                  </div>

                  {/* Packer Assignment */}
                  <div>
                    <label className="form-group label">
                      <i className="fas fa-box"></i> Assigned Packer
                    </label>
                    {selectedOrder.status === "pending" ||
                    selectedOrder.status === "picked" ? (
                      <select
                        value={selectedOrder.assignedPackerId || ""}
                        onChange={(e) =>
                          assignWorker(
                            selectedOrder.id,
                            "packer",
                            parseInt(e.target.value) || null,
                          )
                        }
                        className="form-input"
                      >
                        <option value="">No packer assigned</option>
                        {workers
                          .filter(
                            (w) =>
                              w.active &&
                              (w.role === "Packer" ||
                                w.role === "Supervisor" ||
                                w.role === "Manager"),
                          )
                          .map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="detail-item-box">
                        {selectedOrder.packerName || "No packer assigned"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="detail-section">
                <div className="detail-section-header">
                  <h3 className="detail-section-title">Order Items</h3>
                  <div className="button-group">
                    {selectedOrder.status === "pending" && !showAddItemForm && (
                      <button
                        onClick={() => setShowAddItemForm(true)}
                        className="button button-small button-success"
                      >
                        <i className="fas fa-plus"></i> Add Item
                      </button>
                    )}
                    {selectedOrder.status === "pending" && !isEditingOrder && (
                      <button
                        onClick={() => setIsEditingOrder(true)}
                        className="button button-small"
                      >
                        <i className="fas fa-edit"></i> Edit Items
                      </button>
                    )}
                    {isEditingOrder && (
                      <button
                        onClick={() => {
                          setIsEditingOrder(false);
                          setEditingItemId(null);
                          setEditingItemQuantity("");
                        }}
                        className="button button-small button-secondary"
                      >
                        <i className="fas fa-times"></i> Done Editing
                      </button>
                    )}
                  </div>
                </div>

                {/* Add Item Form */}
                {showAddItemForm && (
                  <div className="add-item-form">
                    <h4 className="add-item-form-title">
                      <i className="fas fa-plus-circle"></i> Add New Item to
                      Order
                    </h4>
                    <div className="add-item-form-row">
                      <div style={{ flex: 2 }}>
                        <label className="order-item-label">Product</label>
                        <select
                          value={newItemToAdd.productId}
                          onChange={(e) =>
                            setNewItemToAdd({
                              ...newItemToAdd,
                              productId: e.target.value,
                            })
                          }
                          className="form-input"
                        >
                          <option value="">Select a product...</option>
                          {products
                            .filter(
                              (p) =>
                                !selectedOrder.items.some(
                                  (item) => item.productId === p.id,
                                ),
                            )
                            .map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} (Stock: {product.stock})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="order-item-label">Quantity</label>
                        <input
                          type="number"
                          value={newItemToAdd.quantity}
                          onChange={(e) =>
                            setNewItemToAdd({
                              ...newItemToAdd,
                              quantity: e.target.value,
                            })
                          }
                          className="form-input"
                          min="1"
                          placeholder="Qty"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (
                            !newItemToAdd.productId ||
                            !newItemToAdd.quantity
                          ) {
                            alert("Please select a product and enter quantity");
                            return;
                          }
                          addItemToOrder(
                            selectedOrder.id,
                            newItemToAdd.productId,
                            newItemToAdd.quantity,
                          );
                          setNewItemToAdd({ productId: "", quantity: "" });
                          setShowAddItemForm(false);
                        }}
                        className="button button-success"
                      >
                        <i className="fas fa-check"></i> Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddItemForm(false);
                          setNewItemToAdd({ productId: "", quantity: "" });
                        }}
                        className="button button-secondary"
                      >
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    </div>
                  </div>
                )}

                <table className="table">
                  <thead>
                    <tr className="table-header">
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price at Order</th>
                      <th>Subtotal</th>
                      {isEditingOrder && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="table-row">
                        <td>{item.productName}</td>
                        <td>
                          {isEditingOrder && editingItemId === item.id ? (
                            <div className="inline-edit-group">
                              <input
                                type="number"
                                value={editingItemQuantity}
                                onChange={(e) =>
                                  setEditingItemQuantity(e.target.value)
                                }
                                className="form-input form-input-small"
                                min="1"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (
                                    !editingItemQuantity ||
                                    editingItemQuantity <= 0
                                  ) {
                                    alert("Please enter a valid quantity");
                                    return;
                                  }
                                  updateOrderItem(
                                    selectedOrder.id,
                                    item.id,
                                    editingItemQuantity,
                                  );
                                  setEditingItemId(null);
                                  setEditingItemQuantity("");
                                }}
                                className="button button-small"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItemId(null);
                                  setEditingItemQuantity("");
                                }}
                                className="button button-small button-secondary"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td>${item.priceAtOrder.toFixed(2)}</td>
                        <td>
                          ${(item.quantity * item.priceAtOrder).toFixed(2)}
                        </td>
                        {isEditingOrder && (
                          <td>
                            {editingItemId !== item.id && (
                              <div className="button-group-inline">
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditingItemQuantity(item.quantity);
                                  }}
                                  className="button button-small"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                {selectedOrder.items.length > 1 && (
                                  <button
                                    onClick={() =>
                                      removeOrderItem(selectedOrder.id, item.id)
                                    }
                                    className="button button-small button-danger"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr
                      className="table-row"
                      style={{ fontWeight: "600", backgroundColor: "#f9fafb" }}
                    >
                      <td colSpan="3" style={{ textAlign: "right" }}>
                        Total:
                      </td>
                      <td>
                        $
                        {selectedOrder.items
                          .reduce(
                            (sum, item) =>
                              sum + item.quantity * item.priceAtOrder,
                            0,
                          )
                          .toFixed(2)}
                      </td>
                      {isEditingOrder && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setIsEditingOrder(false);
                    setEditOrderItems([]);
                    setEditingItemId(null);
                    setEditingItemQuantity("");
                    setShowAddItemForm(false);
                    setNewItemToAdd({ productId: "", quantity: "" });
                  }}
                  className="button button-secondary"
                >
                  <i className="fas fa-times"></i> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Products page
  const renderProductsPage = () => (
    <>
      <div className="page-header">
        <h1 className="page-header-title">
          <i className="fas fa-box"></i> Products Management
        </h1>
        <button onClick={exportProductsToCSV} className="button">
          <i className="fas fa-download"></i> Export to CSV
        </button>
      </div>

      {/* Add Product Form */}
      <div className="section">
        <h2 className="section-title">Add New Product</h2>
        <div className="card">
          <form onSubmit={addProduct} className="form-inline">
            <div style={{ flex: 1 }}>
              <label>Product Name</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="e.g., Widget C"
                className="form-input"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Initial Stock</label>
              <input
                type="number"
                value={newProductStock}
                onChange={(e) => setNewProductStock(e.target.value)}
                placeholder="e.g., 100"
                min="0"
                className="form-input"
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
          <p className="form-help-text" style={{ marginBottom: "15px" }}>
            Upload a CSV file with columns:{" "}
            <strong>
              name, stock, eanCode, description, category, supplier, price,
              minStock
            </strong>
          </p>
          <div className="button-group">
            <input
              type="file"
              accept=".csv"
              onChange={handleProductFileUpload}
              id="product-csv-upload"
              className="file-upload-hidden"
            />
            <label
              htmlFor="product-csv-upload"
              className="button file-upload-label"
            >
              <i className="fas fa-file-csv"></i> Choose CSV File
            </label>
            <button
              onClick={downloadProductTemplate}
              className="button button-success"
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
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products by name..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="search-input"
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
                      className="table-row-clickable"
                    >
                      {product.id}
                    </td>
                    <td
                      onClick={() => viewProductDetails(product)}
                      className="table-row-clickable"
                    >
                      {product.name}
                    </td>
                    <td
                      onClick={() => viewProductDetails(product)}
                      className="table-row-clickable"
                    >
                      {editingProductId === product.id ? (
                        <div
                          className="inline-edit-group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="number"
                            value={editingStock}
                            onChange={(e) => setEditingStock(e.target.value)}
                            min="0"
                            className="form-input form-input-small"
                            autoFocus
                          />
                          <button
                            onClick={() => updateProductStock(product.id)}
                            className="button button-small"
                          >
                            <i className="fas fa-check"></i> Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingProductId(null);
                              setEditingStock("");
                            }}
                            className="button button-small button-secondary"
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
                          className="button button-small"
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

  // Customers page
  const renderCustomersPage = () => (
    <>
      <div className="page-header">
        <h1 className="page-header-title">
          <i className="fas fa-address-book"></i> Customers Management
        </h1>
        <button
          onClick={() => setShowAddCustomerForm(!showAddCustomerForm)}
          className="button"
        >
          <i className={`fas fa-${showAddCustomerForm ? "times" : "plus"}`}></i>
          {showAddCustomerForm ? "Cancel" : "Add Customer"}
        </button>
      </div>

      {/* Add Customer Form */}
      {showAddCustomerForm && (
        <div className="section">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Add New Customer</h3>
            <form onSubmit={addCustomer}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    className="form-input"
                    placeholder="555-0100"
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        company: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  className="form-input"
                  rows="2"
                />
              </div>
              <button type="submit" className="button">
                <i className="fas fa-save"></i> Add Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customers List */}
      <div className="section">
        <div className="card">
          <p className="info-box">
            <i className="fas fa-info-circle"></i>
            Click on any customer to view their order history and details
          </p>
          {customers.length === 0 ? (
            <p className="empty-state">
              No customers yet. Add your first customer above!
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="table-row"
                    style={{
                      cursor:
                        editingCustomer?.id === customer.id
                          ? "default"
                          : "pointer",
                    }}
                    onClick={() => {
                      if (!editingCustomer) {
                        fetchCustomerOrders(customer.id);
                      }
                    }}
                  >
                    {editingCustomer?.id === customer.id ? (
                      // Edit mode (prevent click-through)
                      <td onClick={(e) => e.stopPropagation()} colSpan="6">
                        <table style={{ width: "100%" }}>
                          <tbody>
                            <tr>
                              <td>{customer.id}</td>
                              <td>
                                <input
                                  type="text"
                                  value={editingCustomer.name}
                                  onChange={(e) =>
                                    setEditingCustomer({
                                      ...editingCustomer,
                                      name: e.target.value,
                                    })
                                  }
                                  className="form-input"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td>
                                <input
                                  type="email"
                                  value={editingCustomer.email || ""}
                                  onChange={(e) =>
                                    setEditingCustomer({
                                      ...editingCustomer,
                                      email: e.target.value,
                                    })
                                  }
                                  className="form-input"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td>
                                <input
                                  type="tel"
                                  value={editingCustomer.phone || ""}
                                  onChange={(e) =>
                                    setEditingCustomer({
                                      ...editingCustomer,
                                      phone: e.target.value,
                                    })
                                  }
                                  className="form-input"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={editingCustomer.company || ""}
                                  onChange={(e) =>
                                    setEditingCustomer({
                                      ...editingCustomer,
                                      company: e.target.value,
                                    })
                                  }
                                  className="form-input"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td>
                                <div className="button-group-inline">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateCustomer(
                                        customer.id,
                                        editingCustomer,
                                      );
                                    }}
                                    className="button button-small"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCustomer(null);
                                    }}
                                    className="button button-small button-secondary"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    ) : (
                      // View mode - clickable
                      <>
                        <td>{customer.id}</td>
                        <td>{customer.name}</td>
                        <td>{customer.email || "-"}</td>
                        <td>{customer.phone || "-"}</td>
                        <td>{customer.company || "-"}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingCustomer(customer)}
                            className="button button-small"
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
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

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedCustomer(null);
            setCustomerOrders([]);
          }}
        >
          <div
            className="modal-content modal-content-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                <i className="fas fa-user"></i> Customer Details
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerOrders([]);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Info Section */}
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Customer ID:</label>
                    <span>#{selectedCustomer.id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedCustomer.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedCustomer.email || "Not provided"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedCustomer.phone || "Not provided"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Company:</label>
                    <span>{selectedCustomer.company || "Not provided"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Address:</label>
                    <span>{selectedCustomer.address || "Not provided"}</span>
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="detail-section">
                <h3>Order Statistics</h3>
                <div
                  className="stats-grid"
                  style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}
                >
                  <div className="stat-card" style={{ padding: "15px" }}>
                    <div className="stat-icon" style={{ fontSize: "24px" }}>
                      <i
                        className="fas fa-shopping-cart"
                        style={{ color: "#3b82f6" }}
                      ></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{customerOrders.length}</div>
                      <div className="stat-label">Total Orders</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: "15px" }}>
                    <div className="stat-icon" style={{ fontSize: "24px" }}>
                      <i
                        className="fas fa-box"
                        style={{ color: "#10b981" }}
                      ></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {customerOrders.reduce(
                          (sum, order) =>
                            sum +
                            order.items.reduce(
                              (itemSum, item) => itemSum + item.quantity,
                              0,
                            ),
                          0,
                        )}
                      </div>
                      <div className="stat-label">Total Items</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: "15px" }}>
                    <div className="stat-icon" style={{ fontSize: "24px" }}>
                      <i
                        className="fas fa-clock"
                        style={{ color: "#f59e0b" }}
                      ></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {
                          customerOrders.filter((o) => o.status === "pending")
                            .length
                        }
                      </div>
                      <div className="stat-label">Pending</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: "15px" }}>
                    <div className="stat-icon" style={{ fontSize: "24px" }}>
                      <i
                        className="fas fa-check-circle"
                        style={{ color: "#8b5cf6" }}
                      ></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {
                          customerOrders.filter((o) => o.status === "processed")
                            .length
                        }
                      </div>
                      <div className="stat-label">Processed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History Section */}
              <div className="detail-section">
                <div className="detail-section-header">
                  <h3 className="detail-section-title">Order History</h3>
                  <button
                    onClick={() => {
                      setNewOrder({
                        customerId: selectedCustomer.id,
                        items: [{ productId: "", quantity: "" }],
                      });
                      setSelectedCustomer(null);
                      setCustomerOrders([]);
                      setCurrentPage("orders");
                      setShowAddOrderForm(true);
                    }}
                    className="button button-small"
                  >
                    <i className="fas fa-plus"></i> Create Order for{" "}
                    {selectedCustomer.name}
                  </button>
                </div>

                {customerOrders.length === 0 ? (
                  <p className="empty-state">
                    No orders yet for this customer.
                  </p>
                ) : (
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table className="table">
                      <thead>
                        <tr className="table-header">
                          <th>Order ID</th>
                          <th>Items</th>
                          <th>Total Qty</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((order) => (
                          <tr key={order.id} className="table-row">
                            <td>#{order.id}</td>
                            <td>
                              <div className="item-list">
                                {order.items.map((item) => (
                                  <div key={item.id} className="item-list-item">
                                    {item.productName} (×{item.quantity})
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              {order.items.reduce(
                                (sum, item) => sum + item.quantity,
                                0,
                              )}{" "}
                              units
                            </td>
                            <td>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
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
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setEditingCustomer(selectedCustomer);
                    setSelectedCustomer(null);
                    setCustomerOrders([]);
                  }}
                  className="button"
                >
                  <i className="fas fa-edit"></i> Edit Customer
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerOrders([]);
                  }}
                  className="button button-secondary"
                >
                  <i className="fas fa-times"></i> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Workers page
  const renderWorkersPage = () => (
    <>
      <div className="page-header">
        <h1 className="page-header-title">
          <i className="fas fa-users"></i> Workers Management
        </h1>
        <button
          onClick={() => setShowAddWorkerForm(!showAddWorkerForm)}
          className="button"
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
              <div className="form-group">
                <label>Link to User Account (Optional)</label>
                <select
                  value={newWorker.userId || ""}
                  onChange={(e) =>
                    setNewWorker({
                      ...newWorker,
                      userId: e.target.value || null,
                    })
                  }
                  className="form-input"
                >
                  <option value="">No user account</option>
                  {users
                    .filter(
                      (user) => !workers.some((w) => w.userId === user.id),
                    )
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                </select>
                <small className="form-help-text">
                  Link this worker to a user account to give them system access
                </small>
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
                  <th>User Account</th>
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
                          <select
                            value={editingWorker.userId || ""}
                            onChange={(e) => {
                              const newUserId = e.target.value || null;
                              console.log("Changing userId to:", newUserId);
                              setEditingWorker({
                                ...editingWorker,
                                userId: newUserId,
                              });
                            }}
                            className="form-input"
                          >
                            <option value="">No user account</option>
                            {users
                              .filter(
                                (user) =>
                                  user.id === editingWorker.userId ||
                                  !workers.some((w) => w.userId === user.id),
                              )
                              .map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.username}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td>
                          <span
                            className={`badge ${worker.active ? "badge-green" : "badge-orange"}`}
                          >
                            {worker.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="button-group-inline">
                            <button
                              onClick={() => {
                                console.log(
                                  "Saving worker with:",
                                  editingWorker,
                                );
                                updateWorker(worker.id, {
                                  name: editingWorker.name,
                                  email: editingWorker.email,
                                  role: editingWorker.role,
                                  phone: editingWorker.phone,
                                  userId: editingWorker.userId || null,
                                });
                              }}
                              className="button button-small"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={() => setEditingWorker(null)}
                              className="button button-small button-secondary"
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
                          {worker.userId ? (
                            <span className="badge badge-green">
                              <i className="fas fa-user-check"></i>
                              {worker.username}
                            </span>
                          ) : (
                            <span className="badge badge-gray">
                              <i className="fas fa-user-slash"></i> No account
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${worker.active ? "badge-green" : "badge-orange"}`}
                          >
                            {worker.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="button-group-inline">
                            <button
                              onClick={() =>
                                setEditingWorker({
                                  ...worker,
                                  userId: worker.userId,
                                })
                              }
                              className="button button-small"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() =>
                                toggleWorkerStatus(worker.id, worker.active)
                              }
                              className={`button button-small ${
                                worker.active ? "" : "button-success"
                              }`}
                              style={{
                                backgroundColor: worker.active
                                  ? "#f59e0b"
                                  : undefined,
                              }}
                            >
                              <i
                                className={`fas fa-${worker.active ? "ban" : "check"}`}
                              ></i>
                            </button>
                            <button
                              onClick={() => deleteWorker(worker.id)}
                              className="button button-small button-danger"
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

  // Users page (Admin only)
  const renderUsersPage = () => {
    // Double-check user is admin
    if (currentUser?.role !== "admin") {
      return (
        <div className="section">
          <div className="card">
            <p className="empty-state">
              Access Denied. Admin privileges required.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="page-header">
          <h1 className="page-header-title">
            <i className="fas fa-users-cog"></i> User Management
          </h1>
        </div>

        {/* Users List */}
        <div className="section">
          <div className="card">
            {users.length === 0 ? (
              <p className="empty-state">No users found.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr className="table-header">
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="table-row">
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`badge ${user.role === "admin" ? "badge-green" : "badge-orange"}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="button-group-inline">
                          <button
                            onClick={() => {
                              const newRole =
                                user.role === "admin" ? "user" : "admin";
                              if (
                                window.confirm(
                                  `Change ${user.username}'s role to ${newRole}?`,
                                )
                              ) {
                                updateUser(user.id, { role: newRole });
                              }
                            }}
                            className="button button-small"
                          >
                            <i className="fas fa-exchange-alt"></i> Toggle Role
                          </button>
                          {user.id !== currentUser.userId && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="button button-small button-danger"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
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

  // Settings page (Admin only)
  const renderSettingsPage = () => {
    // Double-check user is admin
    if (currentUser?.role !== "admin") {
      return (
        <div className="section">
          <div className="card">
            <p className="empty-state">
              Access Denied. Admin privileges required.
            </p>
          </div>
        </div>
      );
    }

    const handleSettingChange = (key, value) => {
      setTempSettings({
        ...tempSettings,
        [key]: value,
      });

      // Apply color changes immediately for live preview
      if (key.startsWith("color_")) {
        const root = document.documentElement;
        const cssVarName = "--" + key.replace(/_/g, "-");
        root.style.setProperty(cssVarName, value);
      }

      // Apply company name to page title immediately
      if (key === "company_name") {
        document.title = value || "OrderFlow";
      }
    };

    const handleSaveSettings = () => {
      updateSettings(tempSettings);
    };

    const handleLogoSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
        setLogoFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleLogoUpload = () => {
      if (logoFile) {
        uploadLogo(logoFile);
        setLogoFile(null);
        setLogoPreview(null);
      }
    };

    return (
      <>
        <h1 className="page-title">
          <i className="fas fa-cog"></i> System Settings
        </h1>

        {isLoadingSettings ? (
          <div className="section">
            <div className="card">
              <p style={{ textAlign: "center", color: "#6b7280" }}>
                <i className="fas fa-spinner fa-spin"></i> Loading settings...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="settings-tabs">
              <button
                onClick={() => setSettingsActiveTab("branding")}
                className={`button settings-tab ${settingsActiveTab === "branding" ? "active" : ""}`}
              >
                <i className="fas fa-palette"></i> Branding
              </button>
              <button
                onClick={() => setSettingsActiveTab("colors")}
                className={`button settings-tab ${settingsActiveTab === "colors" ? "active" : ""}`}
              >
                <i className="fas fa-paint-brush"></i> Colors
              </button>
              <button
                onClick={() => setSettingsActiveTab("system")}
                className={`button settings-tab ${settingsActiveTab === "system" ? "active" : ""}`}
              >
                <i className="fas fa-sliders-h"></i> System
              </button>
            </div>

            {/* Branding Tab */}
            {settingsActiveTab === "branding" && (
              <div className="section">
                <div className="card">
                  <h2 className="section-title">
                    <i className="fas fa-palette"></i> Branding Settings
                  </h2>

                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={tempSettings.company_name || ""}
                      onChange={(e) =>
                        handleSettingChange("company_name", e.target.value)
                      }
                      className="form-input"
                      placeholder="e.g., Acme Corporation"
                    />
                    <small className="form-help-text">
                      This name appears throughout the application
                    </small>
                  </div>

                  <div className="form-group" style={{ marginTop: "20px" }}>
                    <label>Company Tagline</label>
                    <input
                      type="text"
                      value={tempSettings.company_tagline || ""}
                      onChange={(e) =>
                        handleSettingChange("company_tagline", e.target.value)
                      }
                      className="form-input"
                      placeholder="e.g., Warehouse Management System"
                    />
                    <small className="form-help-text">
                      Appears below the company name
                    </small>
                  </div>

                  <div className="form-group" style={{ marginTop: "30px" }}>
                    <label>
                      <i className="fas fa-image"></i> Company Logo
                    </label>

                    {/* Current Logo Display */}
                    {settings.company_logo_url && !logoPreview && (
                      <div className="logo-display">
                        <img
                          src={`http://localhost:3000${settings.company_logo_url}`}
                          alt="Company Logo"
                          className="preview-image"
                        />
                        <button
                          onClick={deleteLogo}
                          className="button button-danger"
                        >
                          <i className="fas fa-trash"></i> Remove Logo
                        </button>
                      </div>
                    )}

                    {/* Logo Preview */}
                    {logoPreview && (
                      <div className="preview-box">
                        <p className="preview-box-title">Preview:</p>
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="preview-image"
                        />
                        <div className="button-group">
                          <button
                            onClick={handleLogoUpload}
                            className="button button-success"
                          >
                            <i className="fas fa-upload"></i> Upload This Logo
                          </button>
                          <button
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreview(null);
                            }}
                            className="button button-secondary"
                          >
                            <i className="fas fa-times"></i> Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      id="logo-upload"
                      className="file-upload-hidden"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="button file-upload-label"
                    >
                      <i className="fas fa-upload"></i> Choose Logo Image
                    </label>
                    <small className="form-help-text">
                      Accepted formats: JPG, PNG, GIF, SVG (Max 5MB)
                    </small>
                  </div>

                  <div className="form-section">
                    <button
                      onClick={handleSaveSettings}
                      className="button button-success"
                    >
                      <i className="fas fa-save"></i> Save Branding Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Colors Tab */}
            {settingsActiveTab === "colors" && (
              <div className="section">
                <div className="card">
                  <h2 className="section-title">
                    <i className="fas fa-paint-brush"></i> Color Customization
                  </h2>

                  <div className="info-banner">
                    <p className="info-banner-title">
                      <i className="fas fa-info-circle"></i> Preview Mode Active
                    </p>
                    <p className="info-banner-text">
                      Colors will update in real-time as you change them. Click
                      "Save" to make them permanent.
                    </p>
                  </div>

                  <div className="color-picker-grid">
                    {/* Primary Color */}
                    <div className="color-picker-group">
                      <label>Primary Color</label>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={tempSettings.color_primary || "#3b82f6"}
                          onChange={(e) =>
                            handleSettingChange("color_primary", e.target.value)
                          }
                          className="form-input-color"
                        />
                        <input
                          type="text"
                          value={tempSettings.color_primary || "#3b82f6"}
                          onChange={(e) =>
                            handleSettingChange("color_primary", e.target.value)
                          }
                          className="form-input"
                        />
                      </div>
                      <small className="form-help-text">
                        Buttons, links, main accents
                      </small>
                    </div>

                    {/* Secondary Color */}
                    <div className="color-picker-group">
                      <label>Secondary Color</label>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={tempSettings.color_secondary || "#1e40af"}
                          onChange={(e) =>
                            handleSettingChange(
                              "color_secondary",
                              e.target.value,
                            )
                          }
                          className="form-input-color"
                        />
                        <input
                          type="text"
                          value={tempSettings.color_secondary || "#1e40af"}
                          onChange={(e) =>
                            handleSettingChange(
                              "color_secondary",
                              e.target.value,
                            )
                          }
                          className="form-input"
                        />
                      </div>
                      <small className="form-help-text">
                        Secondary elements
                      </small>
                    </div>

                    {/* Sidebar Background */}
                    <div className="color-picker-group">
                      <label>Sidebar Background</label>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={tempSettings.color_sidebar || "#1f2937"}
                          onChange={(e) =>
                            handleSettingChange("color_sidebar", e.target.value)
                          }
                          className="form-input-color"
                        />
                        <input
                          type="text"
                          value={tempSettings.color_sidebar || "#1f2937"}
                          onChange={(e) =>
                            handleSettingChange("color_sidebar", e.target.value)
                          }
                          className="form-input"
                        />
                      </div>
                      <small className="form-help-text">
                        Navigation sidebar color
                      </small>
                    </div>

                    {/* Sidebar Text */}
                    <div className="color-picker-group">
                      <label>Sidebar Text</label>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={tempSettings.color_sidebar_text || "#ffffff"}
                          onChange={(e) =>
                            handleSettingChange(
                              "color_sidebar_text",
                              e.target.value,
                            )
                          }
                          className="form-input-color"
                        />
                        <input
                          type="text"
                          value={tempSettings.color_sidebar_text || "#ffffff"}
                          onChange={(e) =>
                            handleSettingChange(
                              "color_sidebar_text",
                              e.target.value,
                            )
                          }
                          className="form-input"
                        />
                      </div>
                      <small className="form-help-text">
                        Text color in sidebar
                      </small>
                    </div>

                    {/* Success Color */}
                    <div className="color-picker-group">
                      <label>Success Color</label>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={tempSettings.color_success || "#10b981"}
                          onChange={(e) =>
                            handleSettingChange("color_success", e.target.value)
                          }
                          className="form-input-color"
                        />
                        <input
                          type="text"
                          value={tempSettings.color_success || "#10b981"}
                          onChange={(e) =>
                            handleSettingChange("color_success", e.target.value)
                          }
                          className="form-input"
                        />
                      </div>
                      <small className="form-help-text">
                        Success states & badges
                      </small>
                    </div>

                    {/* Warning Color */}
                    <div className="color-picker-group">
                      <label>Warning Color</label>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={tempSettings.color_warning || "#f59e0b"}
                          onChange={(e) =>
                            handleSettingChange("color_warning", e.target.value)
                          }
                          className="form-input-color"
                        />
                        <input
                          type="text"
                          value={tempSettings.color_warning || "#f59e0b"}
                          onChange={(e) =>
                            handleSettingChange("color_warning", e.target.value)
                          }
                          className="form-input"
                        />
                      </div>
                      <small className="form-help-text">
                        Warning states & badges
                      </small>
                    </div>

                    {/* Danger Color */}
                    <div className="color-picker-group">
                      <label>Danger Color</label>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={tempSettings.color_danger || "#ef4444"}
                          onChange={(e) =>
                            handleSettingChange("color_danger", e.target.value)
                          }
                          className="form-input-color"
                        />
                        <input
                          type="text"
                          value={tempSettings.color_danger || "#ef4444"}
                          onChange={(e) =>
                            handleSettingChange("color_danger", e.target.value)
                          }
                          className="form-input"
                        />
                      </div>
                      <small className="form-help-text">
                        Error states & delete buttons
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <button
                      onClick={handleSaveSettings}
                      className="button button-success"
                    >
                      <i className="fas fa-save"></i> Save Color Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {settingsActiveTab === "system" && (
              <div className="section">
                <div className="card">
                  <h2 className="section-title">
                    <i className="fas fa-sliders-h"></i> System Settings
                  </h2>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Currency Symbol</label>
                      <input
                        type="text"
                        value={tempSettings.currency_symbol || "$"}
                        onChange={(e) =>
                          handleSettingChange("currency_symbol", e.target.value)
                        }
                        className="form-input"
                        placeholder="$"
                        maxLength="3"
                      />
                      <small className="form-help-text">
                        Symbol used for prices (e.g., $, €, £)
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Low Stock Threshold</label>
                      <input
                        type="number"
                        value={tempSettings.low_stock_threshold || 10}
                        onChange={(e) =>
                          handleSettingChange(
                            "low_stock_threshold",
                            e.target.value,
                          )
                        }
                        className="form-input"
                        min="0"
                      />
                      <small className="form-help-text">
                        Show warnings when stock falls below this number
                      </small>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginTop: "20px" }}>
                    <div className="form-group">
                      <label>Items Per Page</label>
                      <select
                        value={tempSettings.items_per_page || 20}
                        onChange={(e) =>
                          handleSettingChange("items_per_page", e.target.value)
                        }
                        className="form-input"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <small className="form-help-text">
                        Default number of items shown in tables
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Date Format</label>
                      <select
                        value={tempSettings.date_format || "MM/DD/YYYY"}
                        onChange={(e) =>
                          handleSettingChange("date_format", e.target.value)
                        }
                        className="form-input"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      </select>
                      <small className="form-help-text">
                        How dates are displayed
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <button
                      onClick={handleSaveSettings}
                      className="button button-success"
                    >
                      <i className="fas fa-save"></i> Save System Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  // Login/Register page
  const renderAuthPage = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          <i className="fas fa-warehouse"></i> OrderFlow
        </h1>
        <p className="auth-subtitle">
          {showLoginForm ? "Welcome back!" : "Create your account"}
        </p>

        <form onSubmit={showLoginForm ? handleLogin : handleRegister}>
          {!showLoginForm && (
            <div className="auth-form-group">
              <label className="auth-form-label">Username</label>
              <input
                type="text"
                value={authForm.username}
                onChange={(e) =>
                  setAuthForm({ ...authForm, username: e.target.value })
                }
                required={!showLoginForm}
                className="auth-form-input"
              />
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-form-label">Email</label>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
              required
              className="auth-form-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Password</label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              required
              minLength={6}
              className="auth-form-input"
            />
            {!showLoginForm && (
              <small className="form-help-text">Minimum 6 characters</small>
            )}
          </div>

          <button type="submit" className="auth-form-button">
            {showLoginForm ? "Login" : "Register"}
          </button>

          <p className="auth-toggle-text">
            {showLoginForm
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => setShowLoginForm(!showLoginForm)}
              className="auth-toggle-button"
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
                <>
                  {settings.company_logo_url ? (
                    <div
                      style={{
                        padding: "20px",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <img
                        src={`http://localhost:3000${settings.company_logo_url}`}
                        alt={settings.company_name || "Company Logo"}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "60px",
                          objectFit: "contain",
                          display: "block",
                          margin: "0 auto",
                        }}
                      />
                      {settings.company_tagline && (
                        <p
                          style={{
                            margin: "10px 0 0 0",
                            fontSize: "12px",
                            textAlign: "center",
                            opacity: 0.8,
                            color: settings.color_sidebar_text || "#ffffff",
                          }}
                        >
                          {settings.company_tagline}
                        </p>
                      )}
                    </div>
                  ) : (
                    <h2>
                      <i className="fas fa-warehouse"></i>{" "}
                      {settings.company_name || "OrderFlow"}
                    </h2>
                  )}
                </>
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
                className={`nav-item ${currentPage === "customers" ? "active" : ""}`}
                onClick={() => setCurrentPage("customers")}
                title="Customers"
              >
                <i className="fas fa-address-book"></i>
                {!sidebarCollapsed && <span> Customers</span>}
              </button>
              <button
                className={`nav-item ${currentPage === "workers" ? "active" : ""}`}
                onClick={() => setCurrentPage("workers")}
                title="Workers"
              >
                <i className="fas fa-users"></i>
                {!sidebarCollapsed && <span> Workers</span>}
              </button>
              {currentUser?.role === "admin" && (
                <button
                  className={`nav-item ${currentPage === "users" ? "active" : ""}`}
                  onClick={() => setCurrentPage("users")}
                  title="Users"
                >
                  <i className="fas fa-users-cog"></i>
                  {!sidebarCollapsed && <span> Users</span>}
                </button>
              )}
              {currentUser?.role === "admin" && (
                <button
                  className={`nav-item ${currentPage === "settings" ? "active" : ""}`}
                  onClick={() => setCurrentPage("settings")}
                  title="Settings"
                >
                  <i className="fas fa-cog"></i>
                  {!sidebarCollapsed && <span> Settings</span>}
                </button>
              )}
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
