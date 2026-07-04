import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './ArticlePage.css';

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data } = await API.get(`/content/${id}`);
        setArticle(data.article);
      } catch {
        navigate('/learn');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="article-page animate-fade-in">
        <div className="article-page__skeleton-title" />
        <div className="article-page__skeleton-body" />
      </div>
    );
  }

  if (!article) return null;

  const catColor = {
    motivation: '#5672ff',
    'hard-work': '#2f43ff',
    results: '#85a3ff',
  }[article.category] || '#0000ff';

  // Render markdown-like bold and paragraphs
  const renderContent = (text) => {
    return text.split('\n\n').map((block, i) => {
      const withBold = block.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (block.startsWith('**') && block.endsWith('**') && block.split('\n').length === 1) {
        return (
          <h3
            key={i}
            className="article-page__subheading"
            dangerouslySetInnerHTML={{ __html: withBold }}
          />
        );
      }
      return (
        <p
          key={i}
          className="article-page__paragraph"
          dangerouslySetInnerHTML={{ __html: withBold }}
        />
      );
    });
  };

  return (
    <div className="article-page animate-fade-in">
      <div className="article-page__breadcrumb">
        <Link to="/learn">← Learn & Grow</Link>
        <span>/</span>
        <span>{article.category}</span>
      </div>

      <article className="article-page__article" style={{ '--cat-color': catColor }}>
        <div className="article-page__color-bar" />
        <div className="article-page__inner">
          <div className="article-page__meta">
            <span className="article-page__category">{article.category.replace('-', ' ')}</span>
            <span className="article-page__dot">·</span>
            <span className="article-page__read-time">{article.readTime}</span>
            <span className="article-page__dot">·</span>
            <span className="article-page__date">
              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="article-page__title">{article.title}</h1>
          <p className="article-page__excerpt">{article.excerpt}</p>

          <div className="article-page__divider" />

          <div className="article-page__body">
            {renderContent(article.content)}
          </div>

          <div className="article-page__divider" />

          <div className="article-page__footer">
            <div className="article-page__author">
              <span className="article-page__author-avatar">✦</span>
              <div>
                <span className="article-page__author-name">{article.author}</span>
                <span className="article-page__author-label">StressLess Freshman</span>
              </div>
            </div>
            <div className="article-page__tags">
              {article.tags?.map((tag) => (
                <span key={tag} className="article-page__tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </article>

      <div className="article-page__cta">
        <Link to="/plans" className="btn btn--primary">
          Apply what you learned — Create a Plan →
        </Link>
        <Link to="/learn" className="btn btn--ghost">
          ← Back to all articles
        </Link>
      </div>
    </div>
  );
}
