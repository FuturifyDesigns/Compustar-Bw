/** Redirect guests to Account before cart actions. Returns true if signed in. */
export function requireAuthForCart(user, { nextPath } = {}) {
  if (user) return true;
  try {
    sessionStorage.setItem(
      'compustar-auth-next',
      nextPath || window.location.pathname || '/Products'
    );
    sessionStorage.setItem(
      'compustar-auth-notice',
      'Sign in or create an account to add products to your cart.'
    );
  } catch {
    /* ignore */
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.history.pushState({}, '', '/Account');
  window.dispatchEvent(new PopStateEvent('popstate'));
  return false;
}
