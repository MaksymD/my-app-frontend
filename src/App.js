// App.js
import React, { useState, useEffect } from 'react';

function App() {
  // State for user authentication (token and username)
  const [token, setToken] = useState(localStorage.getItem('authToken')); // Persist token
  const [username, setUsername] = useState(localStorage.getItem('username')); // Persist username

  // State for login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  // State for items and item management
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editItemId, setEditItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = '';

  // State for general messages (e.g., success/error from CRUD operations)
  const [appMessage, setAppMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const API_BASE_URL = 'http://localhost:5000/api';

  // --- Authentication Functions ---

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage('');
    setAppMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUsername(loginUsername); // Set the logged-in username
        localStorage.setItem('authToken', data.token); // Store token in local storage
        localStorage.setItem('username', loginUsername); // Store username in local storage
        setLoginMessage('Login successful!');
        setLoginUsername('');
        setLoginPassword('');
        fetchItems(); // Fetch items immediately after successful login
      } else {
        setLoginMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginMessage('An error occurred during login.');
    }
  };

  // Handle user logout
  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('authToken'); // Clear token from local storage
    localStorage.removeItem('username'); // Clear username from local storage
    setItems([]); // Clear items on logout
    setLoginMessage('Logged out successfully.');
    setAppMessage('');
  };

  // --- Item Management Functions ---

  // Fetch all items from the backend
  const fetchItems = async () => {
    if (!token) {
      setItems([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
        setAppMessage(''); // Clear any previous app messages
      } else if (response.status === 401 || response.status === 403) {
        // Token expired or invalid, force logout
        handleLogout();
        setLoginMessage('Session expired. Please log in again.');
      } else {
        const errorData = await response.json();
        setAppMessage(`Failed to fetch items: ${errorData.message}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Fetch items error:', error);
      setAppMessage('An error occurred while fetching items.');
      setMessageType('error');
    }
  };

  // Add a new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    setAppMessage('');
    if (!newItemName || !newItemDescription) {
      setAppMessage('Please enter both name and description for the new item.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newItemName, description: newItemDescription }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppMessage('Item added successfully!');
        setMessageType('success');
        setNewItemName('');
        setNewItemDescription('');
        fetchItems(); // Refresh the list of items
      } else {
        setAppMessage(`Failed to add item: ${data.message || 'Unknown error'}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Add item error:', error);
      setAppMessage('An error occurred while adding the item.');
      setMessageType('error');
    }
  };

  // Start editing an item
  const startEditing = (item) => {
    setEditItemId(item.id);
    setEditItemName(item.name);
    setEditItemDescription(item.description);
    setAppMessage(''); // Clear any previous messages
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditItemId(null);
    setEditItemName('');
    setEditItemDescription('');
  };

  // Save edited item
  const handleEditItem = async (e) => {
    e.preventDefault();
    setAppMessage('');
    if (!editItemName && !editItemDescription) {
      setAppMessage('Please enter at least a name or description to update.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/items/${editItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editItemName, description: editItemDescription }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppMessage('Item updated successfully!');
        setMessageType('success');
        cancelEditing(); // Exit edit mode
        fetchItems(); // Refresh the list of items
      } else {
        setAppMessage(`Failed to update item: ${data.message || 'Unknown error'}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Edit item error:', error);
      setAppMessage('An error occurred while updating the item.');
      setMessageType('error');
    }
  };

  // Delete an item
  const handleDeleteItem = async (id) => {
    setAppMessage('');
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return; // User cancelled
    }

    try {
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAppMessage('Item deleted successfully!');
        setMessageType('success');
        fetchItems(); // Refresh the list of items
      } else {
        setAppMessage(`Failed to delete item: ${data.message || 'Unknown error'}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Delete item error:', error);
      setAppMessage('An error occurred while deleting the item.');
      setMessageType('error');
    }
  };

  // Effect hook to fetch items when the component mounts or token changes
  useEffect(() => {
    fetchItems();
  }, [token]); // Re-fetch items if token changes (e.g., after login/logout)

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex flex-col items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-8">
          React & Node.js App
        </h1>

        {/* Global Application Message Display */}
        {appMessage && (
          <div className={`p-3 mb-4 rounded-md text-center ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {appMessage}
          </div>
        )}

        {/* Authentication Section */}
        {!token ? (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username:</label>
                <input
                  type="text"
                  id="username"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label>
                <input
                  type="password"
                  id="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </button>
            </form>
            {loginMessage && (
              <p className={`mt-4 text-center ${loginMessage.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                {loginMessage}
              </p>
            )}
            <p className="mt-4 text-center text-sm text-gray-500">
              Try with: <span className="font-semibold">testuser/password123</span> or <span className="font-semibold">admin/adminpassword</span>
            </p>
          </div>
        ) : (
          // Logged in view
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-indigo-50">
            <h2 className="text-2xl font-semibold text-indigo-800 mb-4 text-center">
              Welcome, {username}!
            </h2>
            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        )}

        {/* Items Section (visible only when logged in) */}
        {token && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Items</h2>

            {/* Add New Item Form */}
            <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label htmlFor="newItemName" className="block text-sm font-medium text-gray-700">Item Name:</label>
                  <input
                    type="text"
                    id="newItemName"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Enter item name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newItemDescription" className="block text-sm font-medium text-gray-700">Description:</label>
                  <textarea
                    id="newItemDescription"
                    rows="3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Enter item description"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Add Item
                </button>
              </form>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <p className="text-center text-gray-500 text-lg">No items found. Add one above!</p>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                    {editItemId === item.id ? (
                      // Edit form for the selected item
                      <form onSubmit={handleEditItem} className="w-full space-y-3">
                        <div>
                          <label htmlFor={`editName-${item.id}`} className="sr-only">Edit Name</label>
                          <input
                            type="text"
                            id={`editName-${item.id}`}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            placeholder="Edit item name"
                          />
                        </div>
                        <div>
                          <label htmlFor={`editDescription-${item.id}`} className="sr-only">Edit Description</label>
                          <textarea
                            id={`editDescription-${item.id}`}
                            rows="2"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={editItemDescription}
                            onChange={(e) => setEditItemDescription(e.target.value)}
                            placeholder="Edit item description"
                          ></textarea>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Display item details
                      <>
                        <div className="flex-1 mb-4 md:mb-0">
                          <h4 className="text-xl font-semibold text-gray-900">{item.name} (ID: {item.id})</h4>
                          <p className="text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => startEditing(item)}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
