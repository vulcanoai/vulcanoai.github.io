#!/usr/bin/env python3
"""
app_first_ui_refactor.py — Automated HTML refactor for Binocu App-First UI

This script:
1. Adds grid-room class to all <body> elements
2. Ensures bottom navigation is present on all pages
3. Includes panels.js script in all pages
4. Maintains existing structure and CSP compliance
"""

import os
import re
from pathlib import Path

# Repo root
REPO_ROOT = Path(__file__).parent.parent
PAGES_DIR = REPO_ROOT / "pages"

# Bottom navigation HTML (from noticias.html)
BOTTOM_NAV_HTML = '''    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <a href="/pages/noticias.html" class="nav-item" data-page="home">
        <svg class="nav-icon" aria-hidden="true">
          <use href="/assets/icons.svg#home"></use>
        </svg>
        <span class="nav-label">Home</span>
      </a>
      <a href="/pages/agentes.html" class="nav-item" data-page="agents">
        <svg class="nav-icon" aria-hidden="true">
          <use href="/assets/icons.svg#users"></use>
        </svg>
        <span class="nav-label">Agents</span>
      </a>
      <a href="/pages/crypto.html" class="nav-item" data-page="markets">
        <svg class="nav-icon" aria-hidden="true">
          <use href="/assets/icons.svg#trending-up"></use>
        </svg>
        <span class="nav-label">Markets</span>
      </a>
      <a href="/pages/apoya.html" class="nav-item" data-page="support">
        <svg class="nav-icon" aria-hidden="true">
          <use href="/assets/icons.svg#heart"></use>
        </svg>
        <span class="nav-label">Support</span>
      </a>
    </nav>'''

# Panel overlay templates for different pages
PANEL_OVERLAYS = {
    'agents': '''
    <!-- Agents Panel Overlay -->
    <div class="panel-overlay" data-panel="agents">
      <div class="panel-sheet">
        <div class="panel-header">
          <h2 class="panel-title">AI Agents</h2>
          <button class="panel-close" aria-label="Close">
            <svg aria-hidden="true" width="20" height="20"><use href="/assets/icons.svg#x"></use></svg>
          </button>
        </div>
        <div class="panel-content">
          <p>AI Agents dashboard loading...</p>
        </div>
      </div>
    </div>''',

    'analytics': '''
    <!-- Analytics Panel Overlay -->
    <div class="panel-overlay" data-panel="analytics">
      <div class="panel-sheet large">
        <div class="panel-header">
          <h2 class="panel-title">Analytics</h2>
          <button class="panel-close" aria-label="Close">
            <svg aria-hidden="true" width="20" height="20"><use href="/assets/icons.svg#x"></use></svg>
          </button>
        </div>
        <div class="panel-content">
          <p>Analytics data loading...</p>
        </div>
      </div>
    </div>''',

    'sources': '''
    <!-- Sources Panel Overlay -->
    <div class="panel-overlay" data-panel="sources">
      <div class="panel-sheet">
        <div class="panel-header">
          <h2 class="panel-title">Data Sources</h2>
          <button class="panel-close" aria-label="Close">
            <svg aria-hidden="true" width="20" height="20"><use href="/assets/icons.svg#x"></use></svg>
          </button>
        </div>
        <div class="panel-content">
          <p>Data sources loading...</p>
        </div>
      </div>
    </div>'''
}

def add_grid_room_class(content):
    """Add grid-room class to body element"""
    # Pattern to find <body> tag with optional existing classes
    body_pattern = r'<body([^>]*)>'

    def body_replacer(match):
        attributes = match.group(1)

        # Check if class attribute exists
        class_pattern = r'class=["\']([^"\']*)["\']'
        class_match = re.search(class_pattern, attributes)

        if class_match:
            existing_classes = class_match.group(1)
            if 'grid-room' not in existing_classes:
                new_classes = f"{existing_classes} grid-room".strip()
                new_attributes = re.sub(class_pattern, f'class="{new_classes}"', attributes)
                return f'<body{new_attributes}>'
        else:
            # No class attribute, add it
            return f'<body{attributes} class="grid-room">'

        return match.group(0)  # Return unchanged if grid-room already present

    return re.sub(body_pattern, body_replacer, content)

def ensure_bottom_nav(content):
    """Ensure bottom navigation is present before </body>"""
    if '<nav class="bottom-nav">' in content:
        return content  # Already has bottom nav

    # Insert before </body>
    return content.replace('</body>', f'{BOTTOM_NAV_HTML}\n  </body>')

def ensure_panels_script(content):
    """Ensure panels.js is included before </body>"""
    if '/assets/js/panels.js' in content:
        return content  # Already included

    script_tag = '    <script src="/assets/js/panels.js"></script>'

    # Find the last script tag before </body> and add after it
    body_close_pattern = r'(.*?)(\s*</body>)'
    match = re.search(body_close_pattern, content, re.DOTALL)

    if match:
        before_body = match.group(1)
        body_close = match.group(2)

        # Add script before </body>
        return f'{before_body}\n{script_tag}{body_close}'

    return content

def add_active_nav_state(content, page_name):
    """Add active state to appropriate nav item"""
    page_mappings = {
        'noticias': 'home',
        'agentes': 'agents',
        'crypto': 'markets',
        'apoya': 'support'
    }

    target_page = page_mappings.get(page_name)
    if not target_page:
        return content

    # Add active class and aria-current to matching nav item
    pattern = rf'(<a href="[^"]*" class="nav-item"[^>]*data-page="{target_page}"[^>]*>)'
    replacement = rf'<a href="/pages/{page_name}.html" class="nav-item active" aria-current="page" data-page="{target_page}">'

    return re.sub(pattern, replacement, content)

def add_panel_overlays(content, page_name):
    """Add relevant panel overlays for the page"""
    overlays_to_add = []

    # Add all overlays to main pages for now
    if page_name in ['noticias', 'agentes', 'crypto']:
        overlays_to_add = ['agents', 'analytics', 'sources']

    if not overlays_to_add:
        return content

    overlays_html = '\n'.join(PANEL_OVERLAYS[overlay] for overlay in overlays_to_add)

    # Insert before bottom nav
    return content.replace('    <!-- Bottom Navigation -->', f'{overlays_html}\n    <!-- Bottom Navigation -->')

def process_html_file(file_path):
    """Process a single HTML file"""
    print(f"Processing {file_path}")

    # Read file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract page name from filename
    page_name = file_path.stem

    # Apply transformations
    content = add_grid_room_class(content)
    content = ensure_bottom_nav(content)
    content = ensure_panels_script(content)
    content = add_active_nav_state(content, page_name)
    content = add_panel_overlays(content, page_name)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Updated {file_path}")

def main():
    """Main refactor function"""
    print("🚀 Starting Binocu App-First UI refactor...")

    # Process index.html
    index_path = REPO_ROOT / "index.html"
    if index_path.exists():
        process_html_file(index_path)

    # Process all HTML files in pages/
    if PAGES_DIR.exists():
        html_files = list(PAGES_DIR.glob("*.html"))

        # Also include files in subdirectories
        html_files.extend(PAGES_DIR.glob("*/*.html"))

        for html_file in html_files:
            process_html_file(html_file)

    print(f"\n✨ Refactor complete! Processed {len(html_files) + 1} files.")
    print("\n📝 Changes made:")
    print("  • Added grid-room class to all <body> elements")
    print("  • Unified bottom navigation across all pages")
    print("  • Included panels.js script for app functionality")
    print("  • Added panel overlays for enhanced UX")
    print("  • Set appropriate active states in navigation")
    print("\n🎯 Next steps:")
    print("  • Test locally: python3 -m http.server 8080")
    print("  • Commit changes: git add -A && git commit -m 'App-first UI with Binocu aesthetic'")

if __name__ == "__main__":
    main()