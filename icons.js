// Shared icon sprite injector for FocusPath
(function(){
  function inject(){
    if(document.getElementById('fpIconSprite')) return; // already present
    var sprite = '\n<svg id="fpIconSprite" width="0" height="0" style="position:absolute;opacity:0;pointer-events:none" aria-hidden="true">\n'
      + '  <symbol id="ico-home" viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"/></symbol>\n'
      + '  <symbol id="ico-flashcards" viewBox="0 0 24 24"><rect x="2" y="6" width="16" height="12" rx="2" ry="2"/><path d="M6 6V4h12a2 2 0 0 1 2 2v10h-2"/></symbol>\n'
      + '  <symbol id="ico-tests" viewBox="0 0 24 24"><path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M9 12h6M9 16h6M9 8h2"/></symbol>\n'
      + '  <symbol id="ico-games" viewBox="0 0 24 24"><path d="M6 3h12a3 3 0 0 1 3 3v8a4 4 0 0 1-4 4h-2l-2 2-2-2H9a4 4 0 0 1-4-4V6a3 3 0 0 1 3-3Z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></symbol>\n'
      + '  <symbol id="ico-dictionary" viewBox="0 0 24 24"><path d="M6 2h9.5a4.5 4.5 0 0 1 0 9H8v11a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1Z"/><path d="M8 4v5h7.5a2.5 2.5 0 0 0 0-5H8Z"/></symbol>\n'
      + '  <symbol id="ico-stats" viewBox="0 0 24 24"><path d="M4 20h16"/><rect x="6" y="10" width="3" height="6" rx="1"/><rect x="11" y="6" width="3" height="10" rx="1"/><rect x="16" y="13" width="3" height="3" rx="1"/></symbol>\n'
      + '</svg>';
    document.body.insertAdjacentHTML('afterbegin', sprite);
    if(!document.getElementById('fpIconStyle')){
      var st = document.createElement('style');
      st.id = 'fpIconStyle';
      st.textContent = '.fp-icon{width:20px;height:20px;display:inline-block;fill:currentColor}';
      document.head.appendChild(st);
    }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
