import {
  ADMIN_THEME_ATTRIBUTE,
  ADMIN_THEME_DARK,
  ADMIN_THEME_STORAGE_PREFIX,
} from "../context/adminThemeConstants.js";

/**
 * Runs while the admin document is still parsing, before the shell paints.
 * It reads only the per-administrator cache that belongs to the authenticated
 * id in this browser and applies the dark attribute. The cache is a rendering
 * hint only; the API response replaces it on mount.
 *
 * The script also checks role/session so a malformed or stale cache can never
 * tint a customer-facing page or an unauthorized visitor.
 */
const themeInitScript = `(function(){try{
var id=localStorage.getItem("id");
var role=localStorage.getItem("role");
var refresh=localStorage.getItem("refreshToken");
if(!id||role!=="ADMIN"||!refresh){return;}
var key="${ADMIN_THEME_STORAGE_PREFIX}:"+id;
if(localStorage.getItem(key)==="${ADMIN_THEME_DARK}"){
document.documentElement.setAttribute("${ADMIN_THEME_ATTRIBUTE}","dark");
document.documentElement.style.colorScheme="dark";
}else{
document.documentElement.removeAttribute("${ADMIN_THEME_ATTRIBUTE}");
}
}catch(e){}})();`;

export default function AdminThemeScript() {
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
