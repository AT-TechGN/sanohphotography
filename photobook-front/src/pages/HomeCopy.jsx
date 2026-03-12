<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PhotoBook Studio — Photographe Professionnel</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    --ink:     #0e0e0e;
    --cream:   #f5f0ea;
    --gold:    #c9a84c;
    --red:     #E94560;
    --dark:    #1A1A2E;
    --mid:     #2a2a3e;
    --muted:   #8a8a9a;
    --white:   #ffffff;
    --serif:   'Cormorant Garamond', Georgia, serif;
    --display: 'Playfair Display', serif;
    --sans:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  html { scroll-behavior: smooth; }

  body {
    font-family: var(--sans);
    background: var(--dark);
    color: var(--cream);
    overflow-x: hidden;
    cursor: none;
  }

  /* ── CURSOR ─────────────────────────────── */
  .cursor {
    width: 10px; height: 10px;
    background: var(--gold);
    border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9999;
    transform: translate(-50%, -50%);
    transition: transform .1s ease, width .2s, height .2s, background .2s;
  }
  .cursor-ring {
    width: 36px; height: 36px;
    border: 1px solid rgba(201,168,76,.4);
    border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9998;
    transform: translate(-50%, -50%);
    transition: transform .18s ease, width .25s, height .25s;
  }
  body:has(a:hover) .cursor, body:has(button:hover) .cursor { width: 18px; height: 18px; background: var(--red); }
  body:has(a:hover) .cursor-ring, body:has(button:hover) .cursor-ring { width: 54px; height: 54px; }

  /* ── SCROLLBAR ───────────────────────────── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--dark); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

  /* ── NAV ─────────────────────────────────── */
  nav {
    position: fixed; top: 0; left: 0; width: 100%; z-index: 100;
    padding: 24px 60px;
    display: flex; align-items: center; justify-content: space-between;
    transition: all .4s ease;
  }
  nav.scrolled {
    background: rgba(14,14,14,.92);
    backdrop-filter: blur(20px);
    padding: 14px 60px;
    border-bottom: 1px solid rgba(201,168,76,.15);
  }
  .nav-logo {
    font-family: var(--display);
    font-size: 22px;
    letter-spacing: .04em;
    color: var(--cream);
    text-decoration: none;
    display: flex; align-items: center; gap: 10px;
  }
  .nav-logo span { color: var(--gold); }
  .logo-dot {
    width: 7px; height: 7px;
    background: var(--gold);
    border-radius: 50%;
    display: inline-block;
  }
  .nav-links {
    display: flex; gap: 36px; list-style: none;
  }
  .nav-links a {
    font-family: var(--sans);
    font-size: 13px; font-weight: 400;
    letter-spacing: .12em; text-transform: uppercase;
    color: rgba(245,240,234,.65);
    text-decoration: none;
    position: relative;
    transition: color .25s;
  }
  .nav-links a::after {
    content: ''; position: absolute;
    bottom: -3px; left: 0;
    width: 0; height: 1px;
    background: var(--gold);
    transition: width .3s ease;
  }
  .nav-links a:hover { color: var(--cream); }
  .nav-links a:hover::after { width: 100%; }
  .nav-cta {
    font-size: 12px; font-weight: 500;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--dark); background: var(--gold);
    padding: 10px 26px; border: none;
    text-decoration: none;
    transition: all .25s;
  }
  .nav-cta:hover { background: var(--cream); color: var(--dark); }

  /* ── HERO ─────────────────────────────────── */
  #hero {
    height: 100vh; min-height: 700px;
    position: relative; overflow: hidden;
    display: flex; align-items: flex-end;
    padding: 0 60px 80px;
  }
  .hero-bg {
    position: absolute; inset: 0;
    background:
      linear-gradient(160deg, rgba(14,14,14,0) 40%, rgba(14,14,14,.85) 100%),
      linear-gradient(to bottom, rgba(14,14,14,.2) 0%, rgba(14,14,14,.7) 100%);
    z-index: 1;
  }
  .hero-grid {
    position: absolute; inset: 0;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
    z-index: 0;
  }
  .hero-cell {
    overflow: hidden; position: relative;
  }
  .hero-cell img, .hero-cell .hero-placeholder {
    width: 100%; height: 100%; object-fit: cover;
    transform: scale(1.08);
    transition: transform 8s ease;
    filter: brightness(.75) saturate(.9);
  }
  .hero-cell:hover .hero-placeholder { transform: scale(1); }

  /* Photo placeholders avec des couleurs chaudes */
  .ph1 { background: linear-gradient(135deg, #2a1f0e 0%, #3d2b14 40%, #1a1208 100%); }
  .ph2 { background: linear-gradient(135deg, #0e1a22 0%, #142433 50%, #0a1018 100%); }
  .ph3 { background: linear-gradient(135deg, #1a0e1a 0%, #2b1433 50%, #0e0814 100%); }

  /* Silhouettes SVG stylisées */
  .ph1::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 40% 70%, rgba(201,168,76,.25) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 30%, rgba(233,69,96,.1) 0%, transparent 50%);
  }
  .ph2::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 50% 60%, rgba(201,168,76,.2) 0%, transparent 55%),
      linear-gradient(180deg, transparent 40%, rgba(0,0,0,.4) 100%);
  }
  .ph3::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 50%, rgba(201,168,76,.15) 0%, transparent 60%);
  }

  /* Icônes photo dans les placeholders */
  .ph-icon {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 64px; opacity: .12;
    filter: sepia(1);
  }
  .ph-label {
    position: absolute; bottom: 20px; left: 50%;
    transform: translateX(-50%);
    font-family: var(--serif);
    font-size: 13px; letter-spacing: .2em;
    color: rgba(201,168,76,.5);
    text-transform: uppercase; white-space: nowrap;
  }

  .hero-content {
    position: relative; z-index: 2;
    max-width: 680px;
  }
  .hero-eyebrow {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 22px;
  }
  .eyebrow-line { width: 40px; height: 1px; background: var(--gold); }
  .eyebrow-text {
    font-family: var(--sans);
    font-size: 11px; font-weight: 500;
    letter-spacing: .25em; text-transform: uppercase;
    color: var(--gold);
  }
  .hero-title {
    font-family: var(--display);
    font-size: clamp(52px, 6vw, 86px);
    font-weight: 700;
    line-height: 1.0;
    margin-bottom: 10px;
    color: var(--cream);
  }
  .hero-title em {
    font-style: italic; color: var(--gold);
    font-weight: 400;
  }
  .hero-subtitle {
    font-family: var(--serif);
    font-size: 20px; font-weight: 300;
    font-style: italic;
    color: rgba(245,240,234,.7);
    margin-bottom: 42px;
    line-height: 1.5;
  }
  .hero-actions {
    display: flex; align-items: center; gap: 32px;
  }
  .btn-primary {
    display: inline-flex; align-items: center; gap: 12px;
    background: var(--gold); color: var(--dark);
    font-size: 12px; font-weight: 500;
    letter-spacing: .15em; text-transform: uppercase;
    padding: 15px 34px; text-decoration: none;
    transition: all .3s ease;
    position: relative; overflow: hidden;
  }
  .btn-primary::before {
    content: ''; position: absolute;
    inset: 0; background: var(--cream);
    transform: translateX(-101%);
    transition: transform .3s ease;
  }
  .btn-primary:hover { color: var(--dark); }
  .btn-primary:hover::before { transform: translateX(0); }
  .btn-primary span { position: relative; z-index: 1; }
  .btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    color: rgba(245,240,234,.7);
    font-size: 12px; font-weight: 400;
    letter-spacing: .12em; text-transform: uppercase;
    text-decoration: none;
    padding: 14px 0;
    border-bottom: 1px solid rgba(245,240,234,.2);
    transition: all .3s;
  }
  .btn-ghost:hover { color: var(--cream); border-color: var(--gold); }
  .btn-arrow { font-size: 18px; transition: transform .3s; }
  .btn-ghost:hover .btn-arrow { transform: translateX(5px); }

  .hero-scroll {
    position: absolute; right: 60px; bottom: 80px; z-index: 2;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .scroll-text {
    font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
    color: rgba(245,240,234,.4);
    writing-mode: vertical-rl;
  }
  .scroll-line {
    width: 1px; height: 60px;
    background: linear-gradient(to bottom, rgba(201,168,76,.6), transparent);
    animation: scrollPulse 2s ease-in-out infinite;
  }
  @keyframes scrollPulse {
    0%, 100% { opacity: .4; transform: scaleY(1); }
    50% { opacity: 1; transform: scaleY(1.1); }
  }

  /* ── STATS BAR ───────────────────────────── */
  #stats {
    background: var(--ink);
    border-top: 1px solid rgba(201,168,76,.15);
    border-bottom: 1px solid rgba(201,168,76,.15);
    padding: 44px 60px;
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0;
  }
  .stat-item {
    text-align: center;
    padding: 0 20px;
    border-right: 1px solid rgba(201,168,76,.1);
    animation: fadeUp .6s ease both;
  }
  .stat-item:last-child { border-right: none; }
  .stat-num {
    font-family: var(--display);
    font-size: 52px; font-weight: 700;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 6px;
    display: block;
  }
  .stat-label {
    font-size: 11px; font-weight: 400;
    letter-spacing: .18em; text-transform: uppercase;
    color: var(--muted);
  }

  /* ── SECTION BASE ────────────────────────── */
  section { padding: 120px 60px; }

  .section-tag {
    display: inline-flex; align-items: center; gap: 12px;
    margin-bottom: 20px;
  }
  .tag-line { width: 30px; height: 1px; background: var(--gold); }
  .tag-text {
    font-size: 10px; font-weight: 500;
    letter-spacing: .25em; text-transform: uppercase;
    color: var(--gold);
  }
  .section-title {
    font-family: var(--display);
    font-size: clamp(38px, 4vw, 58px);
    font-weight: 700; line-height: 1.1;
    color: var(--cream);
    margin-bottom: 18px;
  }
  .section-title em { color: var(--gold); font-style: italic; font-weight: 400; }
  .section-body {
    font-family: var(--serif);
    font-size: 18px; font-weight: 300;
    line-height: 1.7;
    color: rgba(245,240,234,.65);
    max-width: 540px;
  }

  /* ── ABOUT ───────────────────────────────── */
  #about {
    background: var(--dark);
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 80px; align-items: center;
    padding: 120px 60px;
  }
  .about-visual {
    position: relative; height: 580px;
  }
  .about-photo-main {
    position: absolute;
    width: 72%; height: 85%;
    top: 0; left: 0;
    background: linear-gradient(135deg, #1a1208 0%, #2d2010 60%, #150f06 100%);
    overflow: hidden;
  }
  .about-photo-main::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 40% 55%, rgba(201,168,76,.2) 0%, transparent 55%);
  }
  .about-photo-accent {
    position: absolute;
    width: 50%; height: 55%;
    bottom: 0; right: 0;
    background: linear-gradient(135deg, #0e1620 0%, #192840 60%, #0a1018 100%);
    border: 3px solid var(--dark);
    overflow: hidden;
  }
  .about-photo-accent::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 40%, rgba(233,69,96,.15) 0%, transparent 55%);
  }
  .about-badge {
    position: absolute;
    bottom: 28px; left: 28px;
    background: var(--gold);
    color: var(--dark);
    padding: 14px 22px;
    z-index: 2;
  }
  .badge-num {
    font-family: var(--display);
    font-size: 32px; font-weight: 700;
    display: block; line-height: 1;
  }
  .badge-text {
    font-size: 10px; letter-spacing: .15em;
    text-transform: uppercase; font-weight: 500;
    display: block; margin-top: 2px;
  }
  .about-text .section-body { margin-bottom: 36px; }
  .about-signature {
    font-family: var(--display);
    font-size: 34px; font-weight: 700;
    font-style: italic;
    color: var(--gold);
    margin-top: 30px;
    letter-spacing: .02em;
  }
  .about-role {
    font-size: 11px; letter-spacing: .2em;
    text-transform: uppercase; color: var(--muted);
    margin-top: 4px;
  }
  .photo-icon-lg {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 80px; opacity: .08;
  }

  /* ── SERVICES ────────────────────────────── */
  #services {
    background: var(--ink);
  }
  .services-header {
    display: flex; justify-content: space-between;
    align-items: flex-end; margin-bottom: 64px;
  }
  .services-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
  }
  .service-card {
    position: relative; overflow: hidden;
    aspect-ratio: 3/4;
    background: var(--mid);
    cursor: pointer;
    group: true;
  }
  .service-bg {
    position: absolute; inset: 0;
    transition: transform .6s ease;
  }
  .service-card:hover .service-bg { transform: scale(1.08); }

  .sb1 { background: linear-gradient(160deg, #1a1208 0%, #2d2010 100%); }
  .sb2 { background: linear-gradient(160deg, #0e1620 0%, #1a2a3a 100%); }
  .sb3 { background: linear-gradient(160deg, #1a0e14 0%, #2a1422 100%); }
  .sb4 { background: linear-gradient(160deg, #0e1a0e 0%, #1a2e1a 100%); }
  .sb5 { background: linear-gradient(160deg, #1a1414 0%, #2e1e1e 100%); }
  .sb6 { background: linear-gradient(160deg, #14141a 0%, #20202e 100%); }
  .sb7 { background: linear-gradient(160deg, #1a1208 0%, #2d2010 100%); }
  .sb8 { background: linear-gradient(160deg, #0e1620 0%, #182030 100%); }

  .service-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 60%, rgba(201,168,76,.18) 0%, transparent 65%);
    opacity: 0; transition: opacity .4s;
  }
  .service-card:hover .service-glow { opacity: 1; }
  .service-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(14,14,14,.95) 0%, rgba(14,14,14,.2) 60%, transparent 100%);
    display: flex; flex-direction: column;
    justify-content: flex-end; padding: 28px;
  }
  .service-icon {
    font-size: 28px; margin-bottom: 12px;
    transform: translateY(4px);
    transition: transform .3s ease;
  }
  .service-card:hover .service-icon { transform: translateY(0); }
  .service-name {
    font-family: var(--serif);
    font-size: 20px; font-weight: 400;
    color: var(--cream); margin-bottom: 4px;
  }
  .service-price {
    font-size: 13px; color: var(--gold);
    font-weight: 500; letter-spacing: .05em;
  }
  .service-tag-s {
    position: absolute; top: 20px; right: 20px;
    font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
    color: rgba(201,168,76,.7);
    border: 1px solid rgba(201,168,76,.25);
    padding: 4px 10px;
  }

  /* ── GALLERY ─────────────────────────────── */
  #gallery {
    background: var(--dark);
  }
  .gallery-header {
    display: flex; justify-content: space-between;
    align-items: flex-end; margin-bottom: 20px;
  }
  .gallery-filters {
    display: flex; gap: 6px; margin-bottom: 40px;
  }
  .filter-btn {
    font-size: 11px; font-weight: 400;
    letter-spacing: .15em; text-transform: uppercase;
    padding: 8px 20px;
    border: 1px solid rgba(201,168,76,.2);
    background: transparent; color: var(--muted);
    cursor: pointer; transition: all .25s;
  }
  .filter-btn.active, .filter-btn:hover {
    border-color: var(--gold);
    color: var(--gold);
    background: rgba(201,168,76,.06);
  }
  .gallery-masonry {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, 200px);
    gap: 4px;
  }
  .gallery-item {
    position: relative; overflow: hidden;
    background: var(--mid);
  }
  .gallery-item:nth-child(1) { grid-column: span 2; grid-row: span 2; }
  .gallery-item:nth-child(4) { grid-column: span 2; }
  .gallery-item:nth-child(7) { grid-column: span 2; grid-row: span 2; }
  .gi-bg {
    width: 100%; height: 100%;
    transition: transform .6s ease;
  }
  .gallery-item:hover .gi-bg { transform: scale(1.06); }
  .gi-overlay {
    position: absolute; inset: 0;
    background: rgba(14,14,14,.0);
    transition: background .3s;
    display: flex; align-items: center; justify-content: center;
  }
  .gallery-item:hover .gi-overlay { background: rgba(14,14,14,.5); }
  .gi-icon {
    font-size: 28px; opacity: 0;
    transform: scale(.7);
    transition: all .3s;
    color: var(--gold);
  }
  .gallery-item:hover .gi-icon { opacity: 1; transform: scale(1); }

  /* Couleurs variées pour les placeholders galerie */
  .gi1 { background: linear-gradient(135deg, #1a1208, #3d2b14, #1a0a08); }
  .gi2 { background: linear-gradient(135deg, #0e1a22, #1a2e3a, #080e14); }
  .gi3 { background: linear-gradient(135deg, #1a0e1a, #2e1a2e, #0e080e); }
  .gi4 { background: linear-gradient(135deg, #0e1a0e, #1a2e1a, #080e08); }
  .gi5 { background: linear-gradient(135deg, #1a1414, #2e2014, #0e0808); }
  .gi6 { background: linear-gradient(135deg, #0e1420, #1a2030, #080a14); }
  .gi7 { background: linear-gradient(135deg, #1a1208, #2e2010, #140c06); }
  .gi8 { background: linear-gradient(135deg, #14101a, #201428, #0c0810); }

  .gi-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 50%, rgba(201,168,76,.12) 0%, transparent 70%);
  }

  /* ── BOOKING PROCESS ─────────────────────── */
  #process {
    background: linear-gradient(160deg, var(--ink) 0%, #151520 100%);
    position: relative; overflow: hidden;
  }
  #process::before {
    content: '';
    position: absolute; top: -200px; right: -200px;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .process-header { margin-bottom: 72px; }
  .process-steps {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 0; position: relative;
  }
  .process-steps::before {
    content: '';
    position: absolute; top: 28px; left: 10%; right: 10%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(201,168,76,.3) 20%, rgba(201,168,76,.3) 80%, transparent);
  }
  .step {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; padding: 0 16px;
    position: relative;
  }
  .step-num {
    width: 56px; height: 56px;
    border: 1px solid rgba(201,168,76,.35);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--serif);
    font-size: 22px; font-weight: 300;
    color: var(--gold);
    background: var(--ink);
    margin-bottom: 22px;
    position: relative; z-index: 1;
    transition: all .3s;
  }
  .step:hover .step-num {
    background: var(--gold); color: var(--dark);
    border-color: var(--gold);
  }
  .step-icon { font-size: 18px; }
  .step-title {
    font-family: var(--serif);
    font-size: 17px; font-weight: 400;
    color: var(--cream); margin-bottom: 10px;
  }
  .step-desc {
    font-size: 13px; color: var(--muted);
    line-height: 1.6;
  }

  /* ── TESTIMONIALS ────────────────────────── */
  #reviews {
    background: var(--dark);
    position: relative; overflow: hidden;
  }
  #reviews::before {
    content: '"';
    position: absolute; top: 60px; left: 40px;
    font-family: var(--display);
    font-size: 320px; line-height: 1;
    color: rgba(201,168,76,.04);
    pointer-events: none; user-select: none;
  }
  .reviews-header {
    display: flex; justify-content: space-between;
    align-items: flex-end; margin-bottom: 64px;
  }
  .rating-summary {
    text-align: right;
  }
  .rating-big {
    font-family: var(--display);
    font-size: 64px; font-weight: 700;
    color: var(--gold); line-height: 1;
    display: block;
  }
  .rating-stars { color: var(--gold); font-size: 16px; letter-spacing: 2px; }
  .rating-count { font-size: 12px; color: var(--muted); margin-top: 4px; letter-spacing: .1em; }
  .reviews-grid {
    display: grid; grid-template-columns: 1.4fr 1fr 1fr;
    gap: 2px;
  }
  .review-card {
    background: var(--ink);
    padding: 40px;
    border-top: 2px solid transparent;
    transition: border-color .3s, transform .3s;
    position: relative;
  }
  .review-card:hover { border-color: var(--gold); transform: translateY(-3px); }
  .review-card.featured {
    border-color: var(--gold);
    background: linear-gradient(160deg, #1a1610, #0e0e0e);
  }
  .review-quote-icon {
    font-family: var(--display);
    font-size: 52px; color: rgba(201,168,76,.2);
    line-height: .8; margin-bottom: 16px;
    display: block;
  }
  .review-stars { color: var(--gold); font-size: 13px; letter-spacing: 2px; margin-bottom: 18px; }
  .review-text {
    font-family: var(--serif);
    font-size: 17px; font-weight: 300; font-style: italic;
    color: rgba(245,240,234,.8);
    line-height: 1.75; margin-bottom: 28px;
  }
  .reviewer {
    display: flex; align-items: center; gap: 14px;
  }
  .reviewer-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: linear-gradient(135deg, var(--mid), #2a2040);
    border: 1px solid rgba(201,168,76,.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .reviewer-name {
    font-size: 14px; font-weight: 500; color: var(--cream);
    display: block;
  }
  .reviewer-type {
    font-size: 11px; color: var(--muted);
    letter-spacing: .1em; text-transform: uppercase;
  }

  /* ── CTA BAND ─────────────────────────────── */
  #cta-band {
    background: var(--gold);
    padding: 80px 60px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 40px;
  }
  .cta-text .section-title { color: var(--dark); }
  .cta-text .section-title em { color: var(--dark); text-decoration: underline; text-decoration-style: wavy; }
  .cta-text .section-body { color: rgba(14,14,14,.7); }
  .btn-dark {
    display: inline-flex; align-items: center; gap: 12px;
    background: var(--dark); color: var(--cream);
    font-size: 12px; font-weight: 500;
    letter-spacing: .15em; text-transform: uppercase;
    padding: 16px 38px; text-decoration: none;
    white-space: nowrap;
    transition: all .3s;
  }
  .btn-dark:hover { background: var(--ink); }

  /* ── CONTACT ─────────────────────────────── */
  #contact {
    background: var(--ink);
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 80px; padding: 120px 60px;
  }
  .contact-info .section-body { margin-bottom: 48px; }
  .contact-details { display: flex; flex-direction: column; gap: 22px; }
  .contact-item {
    display: flex; align-items: flex-start; gap: 18px;
    padding-bottom: 22px;
    border-bottom: 1px solid rgba(201,168,76,.08);
  }
  .contact-item:last-child { border: none; }
  .contact-icon {
    width: 40px; height: 40px;
    border: 1px solid rgba(201,168,76,.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .contact-label {
    font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 4px; display: block;
  }
  .contact-value {
    font-family: var(--serif);
    font-size: 16px; font-weight: 300; color: var(--cream);
  }
  .contact-form { display: flex; flex-direction: column; gap: 18px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-label {
    font-size: 10px; letter-spacing: .18em;
    text-transform: uppercase; color: var(--muted);
  }
  .form-input, .form-select, .form-textarea {
    background: rgba(245,240,234,.04);
    border: 1px solid rgba(201,168,76,.15);
    color: var(--cream);
    padding: 14px 18px;
    font-family: var(--sans); font-size: 14px;
    outline: none;
    transition: border-color .25s;
    width: 100%;
    -webkit-appearance: none;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: var(--gold);
  }
  .form-input::placeholder { color: rgba(245,240,234,.2); }
  .form-select option { background: var(--ink); }
  .form-textarea { resize: none; height: 110px; }
  .form-submit {
    background: var(--gold); color: var(--dark);
    border: none; cursor: pointer;
    padding: 16px 40px;
    font-size: 12px; font-weight: 500;
    letter-spacing: .15em; text-transform: uppercase;
    align-self: flex-start;
    transition: all .3s;
  }
  .form-submit:hover { background: var(--cream); }

  /* ── FOOTER ──────────────────────────────── */
  footer {
    background: #080808;
    padding: 64px 60px 36px;
  }
  .footer-main {
    display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr;
    gap: 60px; margin-bottom: 60px;
  }
  .footer-brand { }
  .footer-logo {
    font-family: var(--display);
    font-size: 22px; color: var(--cream);
    margin-bottom: 16px; display: block;
  }
  .footer-logo span { color: var(--gold); }
  .footer-tagline {
    font-family: var(--serif);
    font-size: 15px; font-weight: 300; font-style: italic;
    color: var(--muted); line-height: 1.6;
    margin-bottom: 28px;
  }
  .footer-socials { display: flex; gap: 12px; }
  .social-btn {
    width: 36px; height: 36px;
    border: 1px solid rgba(201,168,76,.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; text-decoration: none;
    color: var(--muted); transition: all .25s;
  }
  .social-btn:hover { border-color: var(--gold); color: var(--gold); }
  .footer-col-title {
    font-size: 10px; letter-spacing: .22em;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 22px; display: block;
  }
  .footer-links { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .footer-links a {
    font-size: 14px; color: var(--muted);
    text-decoration: none; transition: color .2s;
  }
  .footer-links a:hover { color: var(--cream); }
  .footer-bottom {
    border-top: 1px solid rgba(201,168,76,.1);
    padding-top: 28px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .footer-copy {
    font-size: 12px; color: rgba(138,138,154,.5);
  }
  .footer-copy span { color: var(--gold); }
  .footer-tech {
    font-size: 11px; color: rgba(138,138,154,.4);
    letter-spacing: .08em;
  }

  /* ── ANIMATIONS ──────────────────────────── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .fade-up {
    opacity: 0; transform: translateY(28px);
    transition: opacity .7s ease, transform .7s ease;
  }
  .fade-up.visible { opacity: 1; transform: translateY(0); }
  .fade-up-d1 { transition-delay: .1s; }
  .fade-up-d2 { transition-delay: .2s; }
  .fade-up-d3 { transition-delay: .3s; }
  .fade-up-d4 { transition-delay: .4s; }

  /* ── HERO ANIMATION ──────────────────────── */
  .hero-content { animation: fadeUp .9s ease .2s both; }
  .hero-scroll  { animation: fadeIn 1s ease .8s both; }

  /* ── SECTION LABELS ──────────────────────── */
  .section-num {
    position: absolute; top: 120px; right: 60px;
    font-family: var(--display);
    font-size: 120px; font-weight: 700;
    color: rgba(201,168,76,.04);
    line-height: 1; user-select: none;
    pointer-events: none;
  }
</style>
</head>
<body>

<!-- CURSOR -->
<div class="cursor" id="cursor"></div>
<div class="cursor-ring" id="cursorRing"></div>

<!-- ══ NAVIGATION ══════════════════════════════════════════════════════ -->
<nav id="navbar">
  <a href="#" class="nav-logo">
    <span class="logo-dot"></span>
    Photo<span>Book</span> Studio
  </a>
  <ul class="nav-links">
    <li><a href="#about">Studio</a></li>
    <li><a href="#services">Services</a></li>
    <li><a href="#gallery">Galerie</a></li>
    <li><a href="#reviews">Avis</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a href="#contact" class="nav-cta">Réserver</a>
</nav>

<!-- ══ HERO ════════════════════════════════════════════════════════════ -->
<section id="hero">
  <div class="hero-grid">
    <div class="hero-cell">
      <div class="hero-placeholder ph1">
        <div class="ph-icon">💍</div>
        <div class="ph-label">Mariage</div>
      </div>
    </div>
    <div class="hero-cell">
      <div class="hero-placeholder ph2">
        <div class="ph-icon">📷</div>
        <div class="ph-label">Portrait</div>
      </div>
    </div>
    <div class="hero-cell">
      <div class="hero-placeholder ph3">
        <div class="ph-icon">🌸</div>
        <div class="ph-label">Famille</div>
      </div>
    </div>
  </div>
  <div class="hero-bg"></div>

  <div class="hero-content">
    <div class="hero-eyebrow">
      <span class="eyebrow-line"></span>
      <span class="eyebrow-text">Photographe professionnel — Conakry, Guinée</span>
    </div>
    <h1 class="hero-title">
      L'art de figer<br>les <em>instants précieux</em>
    </h1>
    <p class="hero-subtitle">
      Chaque lumière, chaque émotion, chaque souvenir —<br>
      immortalisés avec une précision artistique rare.
    </p>
    <div class="hero-actions">
      <a href="#contact" class="btn-primary">
        <span>Réserver une séance</span>
        <span>→</span>
      </a>
      <a href="#gallery" class="btn-ghost">
        <span>Voir la galerie</span>
        <span class="btn-arrow">→</span>
      </a>
    </div>
  </div>

  <div class="hero-scroll">
    <span class="scroll-text">Défiler</span>
    <div class="scroll-line"></div>
  </div>
</section>

<!-- ══ STATS ════════════════════════════════════════════════════════════ -->
<div id="stats">
  <div class="stat-item fade-up">
    <span class="stat-num" data-target="850">0</span>
    <span class="stat-label">Séances réalisées</span>
  </div>
  <div class="stat-item fade-up fade-up-d1">
    <span class="stat-num" data-target="12">0</span>
    <span class="stat-label">Types de prestations</span>
  </div>
  <div class="stat-item fade-up fade-up-d2">
    <span class="stat-num" data-target="98">0</span>
    <span class="stat-label">% de clients satisfaits</span>
  </div>
  <div class="stat-item fade-up fade-up-d3">
    <span class="stat-num" data-target="7">0</span>
    <span class="stat-label">Années d'expérience</span>
  </div>
</div>

<!-- ══ ABOUT ════════════════════════════════════════════════════════════ -->
<section id="about">
  <div class="about-visual fade-up">
    <div class="about-photo-main">
      <div class="photo-icon-lg">📷</div>
    </div>
    <div class="about-photo-accent">
      <div class="photo-icon-lg" style="font-size:40px">🎞️</div>
    </div>
    <div class="about-badge">
      <span class="badge-num">7+</span>
      <span class="badge-text">Ans d'expertise</span>
    </div>
  </div>
  <div class="about-text">
    <div class="section-tag fade-up">
      <span class="tag-line"></span>
      <span class="tag-text">Notre studio</span>
    </div>
    <h2 class="section-title fade-up fade-up-d1">
      Capturer l'âme<br>de chaque <em>moment</em>
    </h2>
    <p class="section-body fade-up fade-up-d2">
      PhotoBook Studio est né d'une passion profonde pour la lumière et l'émotion humaine. Basé à Conakry, notre studio allie expertise technique et sensibilité artistique pour transformer chaque séance en œuvre d'art unique.
    </p>
    <p class="section-body fade-up fade-up-d3" style="margin-top:16px;">
      Mariages, baptêmes, shootings mode, portraits — chaque prestation est pensée pour révéler la beauté authentique de nos clients dans un cadre professionnel et bienveillant.
    </p>
    <div class="about-signature fade-up fade-up-d4">Mamadou Diallo</div>
    <div class="about-role fade-up fade-up-d4">Photographe fondateur & Directeur artistique</div>
  </div>
</section>

<!-- ══ SERVICES ══════════════════════════════════════════════════════════ -->
<section id="services" style="position:relative;">
  <span class="section-num">02</span>
  <div class="services-header">
    <div>
      <div class="section-tag fade-up">
        <span class="tag-line"></span>
        <span class="tag-text">Prestations</span>
      </div>
      <h2 class="section-title fade-up fade-up-d1">
        Nos <em>12 types</em><br>de séances
      </h2>
    </div>
    <a href="#contact" class="btn-primary fade-up" style="height:fit-content;">
      <span>Voir tous les tarifs</span>
      <span>→</span>
    </a>
  </div>
  <div class="services-grid">
    <div class="service-card fade-up">
      <div class="service-bg sb1"></div>
      <div class="service-glow"></div>
      <div class="service-overlay">
        <span class="service-icon">💍</span>
        <div class="service-name">Mariage</div>
        <div class="service-price">À partir de 1 500 000 GNF</div>
      </div>
      <div class="service-tag-s">Populaire</div>
    </div>
    <div class="service-card fade-up fade-up-d1">
      <div class="service-bg sb2"></div>
      <div class="service-glow"></div>
      <div class="service-overlay">
        <span class="service-icon">🍼</span>
        <div class="service-name">Baptême</div>
        <div class="service-price">À partir de 500 000 GNF</div>
      </div>
    </div>
    <div class="service-card fade-up fade-up-d2">
      <div class="service-bg sb3"></div>
      <div class="service-glow"></div>
      <div class="service-overlay">
        <span class="service-icon">🎂</span>
        <div class="service-name">Anniversaire</div>
        <div class="service-price">À partir de 400 000 GNF</div>
      </div>
    </div>
    <div class="service-card fade-up fade-up-d3">
      <div class="service-bg sb4"></div>
      <div class="service-glow"></div>
      <div class="service-overlay">
        <span class="service-icon">🎗️</span>
        <div class="service-name">Cérémonie</div>
        <div class="service-price">À partir de 800 000 GNF</div>
      </div>
    </div>
    <div class="service-card fade-up">
      <div class="service-bg sb5"></div>
      <div class="service-glow"></div>
      <div class="service-overlay">
        <span class="service-icon">👗</span>
        <div class="service-name">Shopping / Mode</div>
        <div class="service-price">À partir de 600 000 GNF</div>
      </div>
    </div>
    <div class="service-card fade-up fade-up-d1">
      <div class="service-bg sb6"></div>
      <div class="service-glow"></div>
      <div class="service-overlay">
        <span class="service-icon">📦</span>
        <div class="service-name">Catalogue Produits</div>
        <div class="service-price">À partir de 700 000 GNF</div>
      </div>
    </div>
    <div class="service-card fade-up fade-up-d2">
      <div class="service-bg sb7"></div>
      <div class="service-glow"></div>
      <div class="service-overlay">
        <span class="service-icon">🏢</span>
        <div class="service-name">Corporate</div>
        <div class="service-price">À partir de 900 000 GNF</div>
      </div>
    </div>
    <div class="service-card fade-up fade-up-d3">
      <div class="service-bg sb8"></div>
      <div class="service-glow"></div>
      <div class="service-overlay">
        <span class="service-icon">🧑‍🎨</span>
        <div class="service-name">Portrait & Book</div>
        <div class="service-price">À partir de 350 000 GNF</div>
      </div>
      <div class="service-tag-s">Nouveau</div>
    </div>
  </div>
</section>

<!-- ══ GALLERY ══════════════════════════════════════════════════════════ -->
<section id="gallery" style="position:relative;">
  <span class="section-num">03</span>
  <div class="gallery-header">
    <div>
      <div class="section-tag fade-up">
        <span class="tag-line"></span>
        <span class="tag-text">Portfolio</span>
      </div>
      <h2 class="section-title fade-up fade-up-d1">
        Galerie<br><em>récente</em>
      </h2>
    </div>
    <a href="#" class="btn-ghost fade-up" style="align-self:flex-end;">
      <span>Voir tout</span>
      <span class="btn-arrow">→</span>
    </a>
  </div>
  <div class="gallery-filters fade-up">
    <button class="filter-btn active">Tous</button>
    <button class="filter-btn">Cette semaine</button>
    <button class="filter-btn">Ce mois</button>
    <button class="filter-btn">Mariage</button>
    <button class="filter-btn">Portrait</button>
    <button class="filter-btn">Commercial</button>
  </div>
  <div class="gallery-masonry fade-up fade-up-d1">
    <div class="gallery-item">
      <div class="gi-bg gi1"><div class="gi-glow"></div></div>
      <div class="gi-overlay"><span class="gi-icon">🔍</span></div>
    </div>
    <div class="gallery-item">
      <div class="gi-bg gi2"><div class="gi-glow"></div></div>
      <div class="gi-overlay"><span class="gi-icon">🔍</span></div>
    </div>
    <div class="gallery-item">
      <div class="gi-bg gi3"><div class="gi-glow"></div></div>
      <div class="gi-overlay"><span class="gi-icon">🔍</span></div>
    </div>
    <div class="gallery-item">
      <div class="gi-bg gi4"><div class="gi-glow"></div></div>
      <div class="gi-overlay"><span class="gi-icon">🔍</span></div>
    </div>
    <div class="gallery-item">
      <div class="gi-bg gi5"><div class="gi-glow"></div></div>
      <div class="gi-overlay"><span class="gi-icon">🔍</span></div>
    </div>
    <div class="gallery-item">
      <div class="gi-bg gi6"><div class="gi-glow"></div></div>
      <div class="gi-overlay"><span class="gi-icon">🔍</span></div>
    </div>
    <div class="gallery-item">
      <div class="gi-bg gi7"><div class="gi-glow"></div></div>
      <div class="gi-overlay"><span class="gi-icon">🔍</span></div>
    </div>
    <div class="gallery-item">
      <div class="gi-bg gi8"><div class="gi-glow"></div></div>
      <div class="gi-overlay"><span class="gi-icon">🔍</span></div>
    </div>
  </div>
</section>

<!-- ══ PROCESS / RÉSERVATION ══════════════════════════════════════════════ -->
<section id="process" style="position:relative;">
  <span class="section-num">04</span>
  <div class="process-header">
    <div class="section-tag fade-up">
      <span class="tag-line"></span>
      <span class="tag-text">Comment ça marche</span>
    </div>
    <h2 class="section-title fade-up fade-up-d1" style="max-width:500px;">
      Réserver en<br><em>5 étapes simples</em>
    </h2>
  </div>
  <div class="process-steps">
    <div class="step fade-up">
      <div class="step-num"><span class="step-icon">🔍</span></div>
      <div class="step-title">Choisir votre prestation</div>
      <div class="step-desc">Parcourez nos 12 types de séances et trouvez celle qui correspond à votre projet</div>
    </div>
    <div class="step fade-up fade-up-d1">
      <div class="step-num"><span class="step-icon">📅</span></div>
      <div class="step-title">Sélectionner la date</div>
      <div class="step-desc">Consultez le calendrier de disponibilités en temps réel et choisissez votre créneau</div>
    </div>
    <div class="step fade-up fade-up-d2">
      <div class="step-num"><span class="step-icon">✍️</span></div>
      <div class="step-title">Compléter le formulaire</div>
      <div class="step-desc">Renseignez vos informations et précisez vos souhaits pour personnaliser la séance</div>
    </div>
    <div class="step fade-up fade-up-d3">
      <div class="step-num"><span class="step-icon">✅</span></div>
      <div class="step-title">Confirmation</div>
      <div class="step-desc">Recevez un email de confirmation avec tous les détails et conseils de préparation</div>
    </div>
    <div class="step fade-up fade-up-d4">
      <div class="step-num"><span class="step-icon">🖼️</span></div>
      <div class="step-title">Recevoir votre album</div>
      <div class="step-desc">Accédez à votre espace client pour consulter et télécharger vos photos retouchées</div>
    </div>
  </div>
</section>

<!-- ══ REVIEWS ══════════════════════════════════════════════════════════ -->
<section id="reviews" style="position:relative;">
  <span class="section-num">05</span>
  <div class="reviews-header">
    <div>
      <div class="section-tag fade-up">
        <span class="tag-line"></span>
        <span class="tag-text">Témoignages</span>
      </div>
      <h2 class="section-title fade-up fade-up-d1">
        Ce que disent<br>nos <em>clients</em>
      </h2>
    </div>
    <div class="rating-summary fade-up">
      <span class="rating-big">4.9</span>
      <div class="rating-stars">★★★★★</div>
      <div class="rating-count">Basé sur 127 avis vérifiés</div>
    </div>
  </div>
  <div class="reviews-grid">
    <div class="review-card featured fade-up">
      <span class="review-quote-icon">"</span>
      <div class="review-stars">★★★★★</div>
      <p class="review-text">
        PhotoBook Studio a sublimé notre mariage. Mamadou a su capturer chaque instant avec une sensibilité rare — les larmes, les rires, les regards complices. Notre album est un trésor que nous contemplerons toute notre vie.
      </p>
      <div class="reviewer">
        <div class="reviewer-avatar">👰</div>
        <div>
          <span class="reviewer-name">Aïssatou & Ibrahima Kouyaté</span>
          <span class="reviewer-type">Mariage — Juin 2025</span>
        </div>
      </div>
    </div>
    <div class="review-card fade-up fade-up-d1">
      <span class="review-quote-icon">"</span>
      <div class="review-stars">★★★★★</div>
      <p class="review-text">
        Shooting corporate impeccable. Les photos de notre équipe pour notre site web sont professionnelles et chaleureuses à la fois. Délai de livraison respecté, qualité exceptionnelle.
      </p>
      <div class="reviewer">
        <div class="reviewer-avatar">👔</div>
        <div>
          <span class="reviewer-name">Seydou Condé</span>
          <span class="reviewer-type">Corporate — Mai 2025</span>
        </div>
      </div>
    </div>
    <div class="review-card fade-up fade-up-d2">
      <span class="review-quote-icon">"</span>
      <div class="review-stars">★★★★★</div>
      <p class="review-text">
        Les photos du baptême de notre fille sont magnifiques. L'équipe est discrète, professionnelle et met vraiment les gens à l'aise. Je recommande les yeux fermés.
      </p>
      <div class="reviewer">
        <div class="reviewer-avatar">👶</div>
        <div>
          <span class="reviewer-name">Fatoumata Barry</span>
          <span class="reviewer-type">Baptême — Avril 2025</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ══ CTA BAND ═════════════════════════════════════════════════════════ -->
<div id="cta-band">
  <div class="cta-text">
    <div class="section-tag">
      <span class="tag-line" style="background:rgba(14,14,14,.3)"></span>
      <span class="tag-text" style="color:var(--dark);opacity:.6">Prêt à immortaliser votre moment ?</span>
    </div>
    <h2 class="section-title" style="font-size:clamp(32px,3.5vw,52px);">
      Réservez votre séance<br><em>dès aujourd'hui</em>
    </h2>
  </div>
  <a href="#contact" class="btn-dark">
    <span>Prendre rendez-vous</span>
    <span>→</span>
  </a>
</div>

<!-- ══ CONTACT ══════════════════════════════════════════════════════════ -->
<section id="contact" style="position:relative;">
  <div class="contact-info">
    <div class="section-tag fade-up">
      <span class="tag-line"></span>
      <span class="tag-text">Nous contacter</span>
    </div>
    <h2 class="section-title fade-up fade-up-d1">
      Parlons de<br>votre <em>projet</em>
    </h2>
    <p class="section-body fade-up fade-up-d2">
      Chaque séance commence par une conversation. Dites-nous ce que vous souhaitez capturer — nous ferons le reste avec passion et professionnalisme.
    </p>
    <div class="contact-details fade-up fade-up-d3">
      <div class="contact-item">
        <div class="contact-icon">📍</div>
        <div>
          <span class="contact-label">Adresse</span>
          <span class="contact-value">Studio PhotoBook, Kaloum<br>Conakry, Guinée</span>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">📞</div>
        <div>
          <span class="contact-label">Téléphone / WhatsApp</span>
          <span class="contact-value">+224 621 00 00 00</span>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">✉️</div>
        <div>
          <span class="contact-label">Email</span>
          <span class="contact-value">contact@photobookstudio.com</span>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">🕐</div>
        <div>
          <span class="contact-label">Horaires studio</span>
          <span class="contact-value">Lun–Sam : 9h00 – 18h00</span>
        </div>
      </div>
    </div>
  </div>
  <div class="contact-form fade-up fade-up-d2">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Prénom</label>
        <input type="text" class="form-input" placeholder="Votre prénom">
      </div>
      <div class="form-group">
        <label class="form-label">Nom</label>
        <input type="text" class="form-input" placeholder="Votre nom">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input type="email" class="form-input" placeholder="votre@email.com">
    </div>
    <div class="form-group">
      <label class="form-label">Type de prestation</label>
      <select class="form-select">
        <option value="" disabled selected>Choisissez une prestation...</option>
        <option>💍 Mariage</option>
        <option>🍼 Baptême</option>
        <option>🎂 Anniversaire</option>
        <option>🎗️ Cérémonie</option>
        <option>👗 Shopping / Mode</option>
        <option>📦 Catalogue Produits</option>
        <option>🏢 Corporate</option>
        <option>🧑‍🎨 Portrait / Book artistique</option>
        <option>🤰 Grossesse</option>
        <option>👨‍👩‍👧 Famille</option>
        <option>🍽️ Culinaire</option>
        <option>✍️ Autre</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Date souhaitée</label>
      <input type="date" class="form-input">
    </div>
    <div class="form-group">
      <label class="form-label">Votre message</label>
      <textarea class="form-textarea" placeholder="Décrivez votre projet, vos attentes, le nombre de personnes..."></textarea>
    </div>
    <button class="form-submit">Envoyer ma demande →</button>
  </div>
</section>

<!-- ══ FOOTER ════════════════════════════════════════════════════════════ -->
<footer>
  <div class="footer-main">
    <div class="footer-brand">
      <span class="footer-logo">Photo<span>Book</span> Studio</span>
      <p class="footer-tagline">
        L'art de capturer vos instants les plus précieux. Studio professionnel basé à Conakry, Guinée.
      </p>
      <div class="footer-socials">
        <a href="#" class="social-btn">📘</a>
        <a href="#" class="social-btn">📸</a>
        <a href="#" class="social-btn">▶️</a>
        <a href="#" class="social-btn">💬</a>
      </div>
    </div>
    <div>
      <span class="footer-col-title">Services</span>
      <ul class="footer-links">
        <li><a href="#">Mariage</a></li>
        <li><a href="#">Portrait & Book</a></li>
        <li><a href="#">Corporate</a></li>
        <li><a href="#">Baptême</a></li>
        <li><a href="#">Mode & Shopping</a></li>
        <li><a href="#">Tous les services</a></li>
      </ul>
    </div>
    <div>
      <span class="footer-col-title">Studio</span>
      <ul class="footer-links">
        <li><a href="#">Notre histoire</a></li>
        <li><a href="#">L'équipe</a></li>
        <li><a href="#">Galerie</a></li>
        <li><a href="#">Témoignages</a></li>
        <li><a href="#">Blog</a></li>
      </ul>
    </div>
    <div>
      <span class="footer-col-title">Compte client</span>
      <ul class="footer-links">
        <li><a href="#">Se connecter</a></li>
        <li><a href="#">Créer un compte</a></li>
        <li><a href="#">Mes réservations</a></li>
        <li><a href="#">Mes albums</a></li>
        <li><a href="#">Support</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span class="footer-copy">© 2025 <span>PhotoBook Studio</span> — Tous droits réservés</span>
    <span class="footer-tech">Symfony 7 · React 18 · Conakry, Guinée</span>
  </div>
</footer>

<script>
  // ── CURSOR
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function animCursor() {
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    rx += (mx - rx) * .12; ry += (my - ry) * .12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();

  // ── NAVBAR SCROLL
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  // ── GALLERY FILTERS
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ── SCROLL REVEAL
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // ── COUNTUP STATS
  function countUp(el) {
    const target = +el.dataset.target;
    const suffix = target >= 98 ? '%' : target === 7 ? '+' : '+';
    let current = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current) + suffix;
      if (current >= target) clearInterval(timer);
    }, 30);
  }
  const statsObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.stat-num').forEach(countUp);
        statsObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  statsObs.observe(document.getElementById('stats'));
</script>
</body>
</html>