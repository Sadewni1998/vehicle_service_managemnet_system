import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Star } from "lucide-react";
import { fetchEshopItems } from "../utils/eshopApi";
import toast from "react-hot-toast";

const Parts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [priceRange, setPriceRange] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic categories and brands based on data
  const categories = ["All", ...new Set(parts.map((part) => part.category))];
  const brands = ["All", ...new Set(parts.map((part) => part.brand))];

  useEffect(() => {
    const loadParts = async () => {
      try {
        const data = await fetchEshopItems();
        // Map API data to component format
        const mappedParts = data.map((item) => ({
          id: item.itemId,
          name: item.itemName,
          category: item.itemType,
          brand: item.itemBrand,
          price: item.price - (item.price*item.discountPercentage / 100), // Calculate new price
          originalPrice: item.price, 
          image: item.itemImage || "/img/service-1.jpg", // Default image if not provided
          inStock: item.quantity > 0,
          description: item.description || "High-quality auto part",
        }));
        setParts(mappedParts);
      } catch (err) {
        setError("Failed to load parts");
        console.error("Error loading parts:", err);
      } finally {
        setLoading(false);
      }
    };
    loadParts();
  }, []);

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      part.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesBrand =
      selectedBrand === "All" ||
      part.brand.toLowerCase() === selectedBrand.toLowerCase();

    // Price range filtering
    let matchesPrice = true;
    if (priceRange !== "all") {
      switch (priceRange) {
        case "0-5000":
          matchesPrice = part.price <= 5000;
          break;
        case "5000-15000":
          matchesPrice = part.price > 5000 && part.price <= 15000;
          break;
        case "15000-30000":
          matchesPrice = part.price > 15000 && part.price <= 30000;
          break;
        case "30000+":
          matchesPrice = part.price > 30000;
          break;
        default:
          matchesPrice = true;
      }
    }

    // Availability filtering
    let matchesAvailability = true;
    if (availability !== "all") {
      switch (availability) {
        case "in-stock":
          matchesAvailability = part.inStock;
          break;
        case "out-of-stock":
          matchesAvailability = !part.inStock;
          break;
        default:
          matchesAvailability = true;
      }
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesBrand &&
      matchesPrice &&
      matchesAvailability
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: "url(/img/carousel-bg-1.jpg)" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Auto Parts</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> /{" "}
              <span className="text-primary-400">Parts</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Parts Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">
              Quality Auto Parts & Accessories
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Find genuine and high-quality auto parts for your vehicle. We
              offer competitive prices and 15% discount when purchased with
              service.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Price Range Filter */}
              <div className="relative flex-1">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Prices</option>
                  <option value="0-5000">Rs. 0 - 5,000</option>
                  <option value="5000-15000">Rs. 5,000 - 15,000</option>
                  <option value="15000-30000">Rs. 15,000 - 30,000</option>
                  <option value="30000+">Rs. 30,000+</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div className="relative flex-1">
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Items</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                  setSelectedBrand("All");
                  setPriceRange("all");
                  setAvailability("all");
                }}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Parts Grid */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm">
              Showing {filteredParts.length} of {parts.length} parts
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredParts.map((part) => (
              <div
                key={part.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <img
                    src={part.image}
                    alt={part.name}
                    className="w-full h-48 object-cover"
                  />
                  {!part.inStock && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Out of Stock
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {part.category}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{part.name}</h3>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    {part.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">
                        Rs. {part.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 line-through ml-2">
                        Rs. {part.originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{part.brand}</span>
                  </div>

                  <button
                    disabled={!part.inStock}
                    onClick={() => {
                      if (!part.inStock) return;
                      try {
                        const stored = localStorage.getItem("eshopCart") || "[]";
                        const cart = JSON.parse(stored);
                        const existingIndex = cart.findIndex((i) => i.id === part.id);
                        if (existingIndex > -1) {
                          cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
                        } else {
                          cart.push({
                            id: part.id,
                            name: part.name,
                            price: part.price,
                            brand: part.brand,
                            image: part.image,
                            description: part.description,
                            quantity: 1,
                          });
                        }
                        localStorage.setItem("eshopCart", JSON.stringify(cart));
                        try { window.dispatchEvent(new CustomEvent("eshopCartUpdated")); } catch (e) {}
                        toast.success(`${part.name} added to cart`);
                      } catch (err) {
                        console.error("Failed to add to cart", err);
                        toast.error("Failed to add item to cart");
                      }
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                      part.inStock
                        ? "bg-primary-600 hover:bg-primary-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {part.inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredParts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No parts found matching your criteria.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Parts?</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              We provide only the highest quality auto parts with competitive
              pricing and excellent customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Genuine Quality",
                description:
                  "All our parts are genuine and meet manufacturer specifications for optimal performance and reliability.",
              },
              {
                title: "Competitive Pricing",
                description:
                  "Get the best prices on quality auto parts with our 15% service discount and regular promotions.",
              },
              {
                title: "Expert Installation",
                description:
                  "Our certified technicians can install your parts with professional service and warranty coverage.",
              },
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Parts;
