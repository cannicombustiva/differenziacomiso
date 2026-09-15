// Next types CSS Modules for the apps; this package typechecks on its own.
declare module '*.module.css' {
  const classes: { readonly [className: string]: string };
  export default classes;
}
