import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import './ContentPage.css';

const CATEGORY_ICONS = {
  motivation: '🔥',
  'hard-work': '💪',
  results: '🏆',
};

export default function ContentPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const params = activeCategory ? `?category=${activeCategory}` : '';
        const { data } = await API.get(`/content${params}`);
        setArticles(data.articles);
        if (data.categories) setCategories(data.categories);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [activeCategory]);

  const featured = articles.filter((a) => a.featured);
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="content-page animate-fade-in">
      {/* Header */}
      <div className="content-page__header">
        <div>
          <h1>Learn & Grow</h1>
          <p>Evidence-based articles to fuel your academic journey</p>
        </div>
      </div>

      {/* Category filters */}
      <div className="content-page__categories">
        <button
          className={`content-page__cat-btn ${activeCategory === '' ? 'content-page__cat-btn--active' : ''}`}
          onClick={() => { setLoading(true); setActiveCategory(''); }}
        >
          All Articles
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`content-page__cat-btn ${activeCategory === cat.id ? 'content-page__cat-btn--active' : ''}`}
            style={{ '--cat-color': cat.color }}
            onClick={() => { setLoading(true); setActiveCategory(cat.id); }}
          >
            <span>{CATEGORY_ICONS[cat.id] || '📖'}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="content-page__grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="article-card article-card--skeleton" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="content-page__empty">
          <span>📚</span>
          <p>No articles in this category yet.</p>
        </div>
      ) : (
        <>
          {featured.length > 0 && !activeCategory && (
            <section className="content-page__section">
              <h2 className="content-page__section-title">Featured</h2>
              <div className="content-page__featured-grid">
                {featured.map((article) => (
                  <ArticleCard key={article.id} article={article} featured />
                ))}
              </div>
            </section>
          )}
          {(rest.length > 0 || activeCategory) && (
            <section className="content-page__section">
              {!activeCategory && featured.length > 0 && (
                <h2 className="content-page__section-title">More Articles</h2>
              )}
              <div className="content-page__grid">
                {(activeCategory ? articles : rest).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ArticleCard({ article, featured = false }) {
  const catColor = {
    motivation: '#f59e0b',
    'hard-work': '#10b981',
    results: '#6366f1',
  }[article.category] || '#3b82f6';

  return (
    <Link
      to={`/learn/${article.id}`}
      className={`article-card ${featured ? 'article-card--featured' : ''}`}
      style={{ '--cat-color': catColor }}
    >
      <div className="article-card__color-bar" />
      <div className="article-card__content">
        <div className="article-card__meta">
          <span className="article-card__category">
            {CATEGORY_ICONS[article.category]} {article.category.replace('-', ' ')}
          </span>
          <span className="article-card__read-time">{article.readTime}</span>
        </div>
        <h3 className="article-card__title">{article.title}</h3>
        <p className="article-card__excerpt">{article.excerpt}</p>
        <div className="article-card__footer">
          <div className="article-card__tags">
            {article.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="article-card__tag">{tag}</span>
            ))}
          </div>
          <span className="article-card__arrow">Read →</span>
        </div>
      </div>
    </Link>
  );
}
