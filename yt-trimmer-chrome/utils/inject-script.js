// Constants to indicate function declaration or execution. STR_INJ is ignored.
const FN_DEF  = 0;
const FN_EXEC = 1;
const STR_INJ = -1;

// Argument stmts is a list of [<Statement>, <Code>], to be declared/executed in that order.
function injectJs(stmts) {
  let scriptElem  = document.createElement('script');
  let scriptText  = '';
  scriptElem.type = 'application/javascript';

  for (let i = 0; i < stmts.length; i += 1) {
    let stmt  = stmts[i];
    if (typeof stmt[0] === 'string') scriptText += stmt[0];
    else if (typeof stmt[0] === 'function' && stmt[1] === FN_DEF) scriptText += stmt[0];
    else if (typeof stmt[0] === 'function' && stmt[1] === FN_EXEC) scriptText += '(' + stmt[0] + ')' + '();';
    else throw 'Invalid script: ' + stmt[0];
    scriptText += '\n';
  }

  scriptElem.textContent = scriptText;
  document.head.appendChild(scriptElem);
  document.head.removeChild(scriptElem);
}

// Optional argument attrs is a list of [<Attribute>, <Value>] to be added to script tag.
function injectJsSrc(src, attrs) {
  let scriptElem  = document.createElement('script');
  if (typeof attrs === 'undefined') attrs = [];

  scriptElem.src  = src;
  scriptElem.type = 'application/javascript';

  for (let i = 0; i < attrs.length; i += 1) {
    let attr = attrs[i];
    scriptElem.setAttribute(attr[0], attr[1]);
  }

  document.head.appendChild(scriptElem);
  document.head.removeChild(scriptElem);
}
