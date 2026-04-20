import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api/v1";
const TOUR_FALLBACK_COUNT = 9;

const fallbackReviews = [
  {
    id: 1,
    user: "Mariam Hassan",
    image: "/img/users/user-7.jpg",
    text: "The storefront now feels much closer to the original Natours flow, but powered by live ecommerce data.",
    rating: 5,
  },
  {
    id: 2,
    user: "Omar Adel",
    image: "/img/users/user-14.jpg",
    text: "The product cards and detail page read like the course frontend instead of a generic dashboard.",
    rating: 4,
  },
  {
    id: 3,
    user: "Nour Mostafa",
    image: "/img/users/user-15.jpg",
    text: "Much better. Overview first, then a proper single-product story page.",
    rating: 5,
  },
];

const currentUser = {
  name: "Ahmed",
  image: "/img/users/user-10.jpg",
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatMonth(value) {
  if (!value) return "Available now";

  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Available now";
  }
}

function getFallbackCover(index) {
  const imageNumber = (index % TOUR_FALLBACK_COUNT) + 1;
  return `/img/tour-${imageNumber}-cover.jpg`;
}

function getFallbackGallery(index) {
  const imageNumber = (index % TOUR_FALLBACK_COUNT) + 1;
  return [
    `/img/tour-${imageNumber}-1.jpg`,
    `/img/tour-${imageNumber}-2.jpg`,
    `/img/tour-${imageNumber}-3.jpg`,
  ];
}

function getGallery(product) {
  if (!product) return [];

  const images = [
    product.imageCover,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean);

  if (images.length >= 3) return images.slice(0, 3);
  if (images.length === 2) return [images[0], images[1], images[0]];
  if (images.length === 1) return [images[0], images[0], images[0]];

  return ["/img/logo-green.png", "/img/logo-green.png", "/img/logo-green.png"];
}

function getCategoryId(product) {
  return typeof product.category === "object" ? product.category?._id : product.category;
}

function App() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const request = async (path) => {
    const response = await fetch(`${API_BASE}${path}`);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(
        payload?.message || (typeof payload === "string" ? payload : "Request failed.")
      );
    }

    return payload;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [categoriesPayload, productsPayload] = await Promise.all([
          request("/categories"),
          request("/products?limit=50"),
        ]);

        const nextCategories = categoriesPayload.data || [];
        const nextProducts = productsPayload.data || [];

        setCategories(nextCategories);
        setProducts(nextProducts);
        setSelectedProductId(nextProducts[0]?._id || "");
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const visibleProducts = useMemo(() => {
    const lowered = keyword.trim().toLowerCase();

    return products.filter((product) => {
      if (!lowered) return true;

      return (
        product.title?.toLowerCase().includes(lowered) ||
        product.description?.toLowerCase().includes(lowered) ||
        product.category?.name?.toLowerCase().includes(lowered)
      );
    });
  }, [products, keyword]);

  const selectedProduct =
    products.find((product) => product._id === selectedProductId) || visibleProducts[0] || null;
  const selectedProductIndex = Math.max(
    products.findIndex((product) => product._id === selectedProduct?._id),
    0
  );

  const selectedCategory = categories.find(
    (category) => category._id === getCategoryId(selectedProduct || {})
  );
  const gallery =
    getGallery(selectedProduct).length >= 3
      ? getGallery(selectedProduct)
      : getFallbackGallery(selectedProductIndex);
  const isOverview = !selectedProductId;

  const openProduct = (productId) => {
    setSelectedProductId(productId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeProduct = () => {
    setSelectedProductId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="site-shell">
        <header className="header">
          <div className="header__logo">
            <img src="/img/logo-white.png" alt="Natours logo" />
          </div>
        </header>
        <main className="main">
          <div className="error">
            <div className="error__title">
              <h2 className="heading-secondary">Loading storefront</h2>
            </div>
            <p className="error__msg">Fetching products from your API.</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="site-shell">
        <header className="header">
          <div className="header__logo">
            <img src="/img/logo-white.png" alt="Natours logo" />
          </div>
        </header>
        <main className="main">
          <div className="error">
            <div className="error__title">
              <h2 className="heading-secondary heading-secondary--error">
                Something went wrong
              </h2>
            </div>
            <p className="error__msg">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <header className="header">
        <nav className="nav nav--tours">
          <button className="nav__el" type="button" onClick={closeProduct}>
            All tours
          </button>
          <form className="nav__search" onSubmit={(event) => event.preventDefault()}>
            <button className="nav__search-btn" type="submit">
              <svg>
                <use xlinkHref="/img/icons.svg#icon-search" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Search tours"
              className="nav__search-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </form>
        </nav>

        <div className="header__logo">
          <img src="/img/logo-white.png" alt="Natours logo" />
        </div>

        <nav className="nav nav--user">
          <button className="nav__el" type="button" onClick={closeProduct}>
            My bookings
          </button>
          <div className="nav__el nav__el--static">
            <img
              src={currentUser.image}
              alt={currentUser.name}
              className="nav__user-img"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/img/users/default.jpg";
              }}
            />
            <span>{currentUser.name}</span>
          </div>
        </nav>
      </header>

      {isOverview ? (
        <main className="main">
          {visibleProducts.length ? (
            <div className="card-container">
              {visibleProducts.map((product) => (
                <div className="card" key={product._id}>
                  <div className="card__header">
                    <div className="card__picture">
                      <div className="card__picture-overlay">&nbsp;</div>
                      <img
                        src={product.imageCover || "/img/logo-green.png"}
                        alt={product.title}
                        className="card__picture-img"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = getFallbackCover(
                            products.findIndex((item) => item._id === product._id)
                          );
                        }}
                      />
                    </div>

                    <h3 className="heading-tertirary">
                      <span>{product.title}</span>
                    </h3>
                  </div>

                  <div className="card__details">
                    <h4 className="card__sub-heading">
                      {product.quantity > 30 ? "Easy in-stock product" : "Limited stock product"}
                    </h4>
                    <p className="card__text">{product.description}</p>

                    <div className="card__data">
                      <svg className="card__icon">
                        <use xlinkHref="/img/icons.svg#icon-map-pin" />
                      </svg>
                      <span>{product.category?.name || "General collection"}</span>
                    </div>
                    <div className="card__data">
                      <svg className="card__icon">
                        <use xlinkHref="/img/icons.svg#icon-calendar" />
                      </svg>
                      <span>{formatMonth(product.createdAt)}</span>
                    </div>
                    <div className="card__data">
                      <svg className="card__icon">
                        <use xlinkHref="/img/icons.svg#icon-flag" />
                      </svg>
                      <span>{Array.isArray(product.images) ? product.images.length : 0} gallery shots</span>
                    </div>
                    <div className="card__data">
                      <svg className="card__icon">
                        <use xlinkHref="/img/icons.svg#icon-user" />
                      </svg>
                      <span>{product.quantity} items</span>
                    </div>
                  </div>

                  <div className="card__footer">
                    <p>
                      <span className="card__footer-value">
                        {formatMoney(product.priceAfterDiscount || product.price)}
                      </span>
                      <span className="card__footer-text"> current price</span>
                    </p>
                    <p className="card__ratings">
                      <span className="card__footer-value">
                        {Number(product.ratingsAverage || 4.8).toFixed(1)}
                      </span>
                      <span className="card__footer-text">
                        {" "}
                        rating ({product.ratingsQuantity || 12})
                      </span>
                    </p>
                    <button
                      type="button"
                      className="btn btn--green btn--small"
                      onClick={() => openProduct(product._id)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="error">
              <div className="error__title">
                <h2 className="heading-secondary heading-secondary--error">No tours found</h2>
              </div>
              <p className="error__msg">Try another search keyword.</p>
            </div>
          )}
        </main>
      ) : (
        <>
          <section className="section-header">
            <div className="header__hero">
              <div className="header__hero-overlay">&nbsp;</div>
              <img
                className="header__hero-img"
                src={selectedProduct?.imageCover || "/img/logo-green.png"}
                alt={selectedProduct?.title}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = getFallbackCover(selectedProductIndex);
                }}
              />
            </div>

            <div className="heading-box">
              <h1 className="heading-primary">
                <span>{selectedProduct?.title}</span>
              </h1>
              <div className="heading-box__group">
                <div className="heading-box__detail">
                  <svg className="heading-box__icon">
                    <use xlinkHref="/img/icons.svg#icon-clock" />
                  </svg>
                  <span className="heading-box__text">
                    {selectedProduct?.quantity || 0} units
                  </span>
                </div>
                <div className="heading-box__detail">
                  <svg className="heading-box__icon">
                    <use xlinkHref="/img/icons.svg#icon-map-pin" />
                  </svg>
                  <span className="heading-box__text">
                    {selectedCategory?.name || "General collection"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="section-description">
            <div className="overview-box">
              <div>
                <div className="overview-box__group">
                  <h2 className="heading-secondary ma-bt-lg">Quick facts</h2>
                  <div className="overview-box__detail">
                    <svg className="overview-box__icon">
                      <use xlinkHref="/img/icons.svg#icon-calendar" />
                    </svg>
                    <span className="overview-box__label">Next date</span>
                    <span className="overview-box__text">
                      {formatMonth(selectedProduct?.createdAt)}
                    </span>
                  </div>
                  <div className="overview-box__detail">
                    <svg className="overview-box__icon">
                      <use xlinkHref="/img/icons.svg#icon-trending-up" />
                    </svg>
                    <span className="overview-box__label">Difficulty</span>
                    <span className="overview-box__text">
                      {selectedProduct?.quantity > 30 ? "Easy" : "Medium"}
                    </span>
                  </div>
                  <div className="overview-box__detail">
                    <svg className="overview-box__icon">
                      <use xlinkHref="/img/icons.svg#icon-user" />
                    </svg>
                    <span className="overview-box__label">Participants</span>
                    <span className="overview-box__text">
                      {selectedProduct?.quantity || 0} items
                    </span>
                  </div>
                  <div className="overview-box__detail">
                    <svg className="overview-box__icon">
                      <use xlinkHref="/img/icons.svg#icon-star" />
                    </svg>
                    <span className="overview-box__label">Rating</span>
                    <span className="overview-box__text">
                      {Number(selectedProduct?.ratingsAverage || 4.8).toFixed(1)} / 5
                    </span>
                  </div>
                </div>

                <div className="overview-box__group">
                  <h2 className="heading-secondary ma-bt-lg">Your tour guides</h2>

                  <div className="overview-box__detail">
                    <img
                      src="/img/users/user-19.jpg"
                      alt="Lead guide"
                      className="overview-box__img"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/img/users/default.jpg";
                      }}
                    />
                    <span className="overview-box__label">Lead guide</span>
                    <span className="overview-box__text">
                      {selectedCategory?.name || "Store manager"}
                    </span>
                  </div>
                  <div className="overview-box__detail">
                    <img
                      src="/img/users/user-18.jpg"
                      alt="Tour guide"
                      className="overview-box__img"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/img/users/default.jpg";
                      }}
                    />
                    <span className="overview-box__label">Tour guide</span>
                    <span className="overview-box__text">Products API</span>
                  </div>
                  <div className="overview-box__detail">
                    <img
                      src="/img/users/user-17.jpg"
                      alt="Intern"
                      className="overview-box__img"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/img/users/default.jpg";
                      }}
                    />
                    <span className="overview-box__label">Intern</span>
                    <span className="overview-box__text">React frontend</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="description-box">
              <h2 className="heading-secondary ma-bt-lg">
                About the {selectedProduct?.title?.toLowerCase()}
              </h2>
              <p className="description__text">{selectedProduct?.description}</p>
              <p className="description__text">
                This product detail page follows the same storytelling structure as
                `tour.html`, while its content is loaded from your ecommerce backend.
              </p>
            </div>
          </section>

          <section className="section-pictures">
            {gallery.map((image, index) => (
              <div className="picture-box" key={`${image}-${index}`}>
                <img
                  className={`picture-box__img picture-box__img--${index + 1}`}
                  src={image}
                  alt={`${selectedProduct?.title} ${index + 1}`}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = getFallbackGallery(selectedProductIndex)[index];
                  }}
                />
              </div>
            ))}
          </section>

          <section className="section-reviews">
            <div className="reviews">
              {fallbackReviews.map((review) => (
                <div className="reviews__card" key={review.id}>
                  <div className="reviews__avatar">
                    <img
                      src={review.image}
                      alt={review.user}
                      className="reviews__avatar-img"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/img/users/default.jpg";
                      }}
                    />
                    <h6 className="reviews__user">{review.user}</h6>
                  </div>
                  <p className="reviews__text">{review.text}</p>
                  <div className="reviews__rating">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <svg
                        key={`${review.id}-${index}`}
                        className={`reviews__star ${
                          index < review.rating
                            ? "reviews__star--active"
                            : "reviews__star--inactive"
                        }`}
                      >
                        <use xlinkHref="/img/icons.svg#icon-star" />
                      </svg>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section-cta">
            <div className="cta">
              <div className="cta__img cta__img--logo">
                <img src="/img/logo-white.png" alt="Natours logo" />
              </div>
              <img
                src={gallery[1]}
                alt=""
                className="cta__img cta__img--1"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = getFallbackGallery(selectedProductIndex)[1];
                }}
              />
              <img
                src={gallery[0]}
                alt=""
                className="cta__img cta__img--2"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = getFallbackGallery(selectedProductIndex)[0];
                }}
              />

              <div className="cta__content">
                <div className="cta__copy">
                  <h2 className="heading-secondary">What are you waiting for?</h2>
                  <p className="cta__text">
                    {selectedProduct?.quantity || 0} units. 1 product. Infinite edits.
                    Make it yours today!
                  </p>
                </div>
                <div className="cta__action">
                  <button className="btn btn--green" type="button" onClick={closeProduct}>
                    Back to overview
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="footer">
        <div className="footer__logo">
          <img src="/img/logo-green.png" alt="Natours logo" />
        </div>
        <ul className="footer__nav">
          <li>
            <a href="#">About us</a>
          </li>
          <li>
            <a href="/api/v1/products?limit=50">Download apps</a>
          </li>
          <li>
            <a href="/api/v1/categories">Become a guide</a>
          </li>
          <li>
            <a href="#">Careers</a>
          </li>
          <li>
            <a href="#">Contact</a>
          </li>
        </ul>
        <p className="footer__copyright">
          React remake of the Natours frontend, connected to your ecommerce API.
        </p>
      </div>
    </div>
  );
}

export default App;
