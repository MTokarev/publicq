# PublicQ GitHub Pages

This directory contains the GitHub Pages site for PublicQ.

## Local Preview

To preview the site locally:

```bash
cd docs
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Deployment

GitHub Pages will automatically deploy from the `docs` folder on the main branch.

To enable GitHub Pages:
1. Go to repository Settings → Pages
2. Set Source to "Deploy from a branch"
3. Select branch: `main`
4. Select folder: `/docs`
5. Click Save

The site will be available at: `https://mtokarev.github.io/publicq/`

## Customization

- `index.html` - Main page content
- `styles.css` - Styling and layout
- Add additional pages as needed

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
