import sanitizeHtml from '../vendor/sanitize-html.js';

// Rich-text content edited in the admin is stored sanitised; the client renders it as HTML.
export function cleanHtml(dirty) {
  return sanitizeHtml(dirty ?? '', {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption', 'details', 'summary', 'h1', 'h2']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'class'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      div: ['class'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // Admin edits receive media-resolved HTML, so legacy {{media:}} tokens never pass through here.
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs) =>
        attribs.target === '_blank' ? { tagName: tag, attribs: { ...attribs, rel: 'noopener noreferrer' } } : { tagName: tag, attribs },
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  });
}
