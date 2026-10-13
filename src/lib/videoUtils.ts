export interface VideoParseResult {
  type: 'youtube' | 'vimeo' | 'loom' | 'gdrive' | 'direct' | 'other';
  embedUrl: string;
}

/**
 * Parses any video URL (YouTube, Vimeo, Loom, Google Drive, Dropbox, or direct video files)
 * and returns the appropriate embedding URL or raw streaming URL, along with its detected source type.
 */
export function getEmbedUrl(url: string | undefined): VideoParseResult {
  if (!url) {
    return { type: 'other', embedUrl: '' };
  }

  const trimmedUrl = url.trim();

  // 1. Direct Video Links (.mp4, .webm, .ogg, .mov, .mkv)
  const cleanUrlPath = trimmedUrl.split('?')[0].split('#')[0].toLowerCase();
  if (
    cleanUrlPath.endsWith('.mp4') ||
    cleanUrlPath.endsWith('.webm') ||
    cleanUrlPath.endsWith('.ogg') ||
    cleanUrlPath.endsWith('.mov') ||
    cleanUrlPath.endsWith('.mkv') ||
    trimmedUrl.includes('raw=1')
  ) {
    return { type: 'direct', embedUrl: trimmedUrl };
  }

  // 2. YouTube URLs
  // Handles: watch?v=..., youtu.be/..., embed/..., shorts/..., m.youtube.com/...
  const ytMatch = trimmedUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube-nocookie\.com\/(?:v|e(?:mbed)?)\/)([^"&?\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`
    };
  }

  // Handle special YouTube Shorts path directly if not caught by main regex
  const ytShortsMatch = trimmedUrl.match(/youtube\.com\/shorts\/([^"&?\s]+)/i);
  if (ytShortsMatch && ytShortsMatch[1]) {
    const cleanId = ytShortsMatch[1].split('?')[0];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${cleanId}?autoplay=0&rel=0&modestbranding=1`
    };
  }

  // 3. Vimeo URLs
  const vimeoMatch = trimmedUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=0&byline=0&portrait=0&title=0`
    };
  }

  // 4. Loom URLs (https://www.loom.com/share/... or loom.com/embed/...)
  const loomMatch = trimmedUrl.match(/loom\.com\/(?:share|embed)\/([^"&?\s]+)/i);
  if (loomMatch && loomMatch[1]) {
    const cleanId = loomMatch[1].split('?')[0];
    return {
      type: 'loom',
      embedUrl: `https://www.loom.com/embed/${cleanId}?hide_share=true&hide_title=true`
    };
  }

  // 5. Google Drive Video URLs
  const gdriveMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`
    };
  }
  const gdriveMatchId = trimmedUrl.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if (gdriveMatchId && gdriveMatchId[1]) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdriveMatchId[1]}/preview`
    };
  }

  // 6. Dropbox URLs (Converting to direct streamable source)
  if (trimmedUrl.includes('dropbox.com')) {
    let directUrl = trimmedUrl.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
    if (!directUrl.includes('?raw=1') && !directUrl.includes('&raw=1')) {
      directUrl += directUrl.includes('?') ? '&raw=1' : '?raw=1';
    }
    return { type: 'direct', embedUrl: directUrl };
  }

  // 7. General URL fallback (e.g., self-hosted streams, other standard iframe embeds)
  return { type: 'other', embedUrl: trimmedUrl };
}

/**
 * Parses Google Drive share URLs or Google Docs/Slides/Sheets/Forms links
 * and returns an optimized embed URL for iframe viewing.
 */
export function getGoogleDriveEmbedUrl(url: string | undefined): { isDrive: boolean; embedUrl: string } {
  if (!url) return { isDrive: false, embedUrl: '' };
  
  const trimmedUrl = url.trim();

  // 1. Google Drive Files (PDFs, PPTXs, general files uploaded to Drive)
  // Matches: drive.google.com/file/d/FILE_ID/view... or drive.google.com/file/d/FILE_ID/preview
  const gdriveMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1].split(/[?#]/)[0];
    return {
      isDrive: true,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
    };
  }
  
  // Matches drive.google.com/open?id=FILE_ID
  const gdriveMatchId = trimmedUrl.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if (gdriveMatchId && gdriveMatchId[1]) {
    const fileId = gdriveMatchId[1].split(/[?#]/)[0];
    return {
      isDrive: true,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
    };
  }

  // 2. Google Slides
  // Matches: docs.google.com/presentation/d/SLIDES_ID/...
  const slidesMatch = trimmedUrl.match(/docs\.google\.com\/presentation\/d\/([^/]+)/i);
  if (slidesMatch && slidesMatch[1]) {
    const slidesId = slidesMatch[1].split(/[?#]/)[0];
    return {
      isDrive: true,
      embedUrl: `https://docs.google.com/presentation/d/${slidesId}/embed?start=false&loop=false&delayms=3000`
    };
  }

  // 3. Google Docs
  // Matches: docs.google.com/document/d/DOC_ID/...
  const docsMatch = trimmedUrl.match(/docs\.google\.com\/document\/d\/([^/]+)/i);
  if (docsMatch && docsMatch[1]) {
    const docId = docsMatch[1].split(/[?#]/)[0];
    return {
      isDrive: true,
      embedUrl: `https://docs.google.com/document/d/${docId}/pub?embedded=true`
    };
  }

  // 4. Google Sheets
  // Matches: docs.google.com/spreadsheets/d/SHEET_ID/...
  const sheetsMatch = trimmedUrl.match(/docs\.google\.com\/spreadsheets\/d\/([^/]+)/i);
  if (sheetsMatch && sheetsMatch[1]) {
    const sheetId = sheetsMatch[1].split(/[?#]/)[0];
    return {
      isDrive: true,
      embedUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/pubhtml?widget=true&headers=false`
    };
  }

  // 5. Google Forms
  // Matches: docs.google.com/forms/d/e/FORM_ID/viewform
  const formsMatch = trimmedUrl.match(/docs\.google\.com\/forms\/d\/e\/([^/]+)/i);
  if (formsMatch && formsMatch[1]) {
    const formId = formsMatch[1].split(/[?#]/)[0];
    return {
      isDrive: true,
      embedUrl: `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`
    };
  }
  
  // Generic docs.google.com fallback if it contains embed/preview/view already
  if (trimmedUrl.includes('docs.google.com') || trimmedUrl.includes('drive.google.com')) {
    return {
      isDrive: true,
      embedUrl: trimmedUrl
    };
  }

  return { isDrive: false, embedUrl: '' };
}

