export type SiteActionType =
  | 'navigate'
  | 'scroll_to'
  | 'phone_call'
  | 'whatsapp'
  | 'email'
  | 'submit_form'
  | 'add_to_cart'
  | 'open_cart';

export interface SiteActionRecord {
  id: string;
  type: SiteActionType;
  target?: string;
  payload?: Record<string, unknown>;
  timestamp: string;
  status: 'simulated' | 'handled' | 'blocked';
  message: string;
}

export interface SiteActionHandlerOptions {
  isPreview?: boolean;
  onNavigate?: (path: string) => void;
  onScrollTo?: (targetId: string) => void;
  onRecordAction?: (record: SiteActionRecord) => void;
  onToast?: (message: string) => void;
}

/**
 * Creates a safe, platform-neutral action dispatcher for Studio components.
 * During Studio preview, simulates ecommerce transactions and logs external contacts safely.
 */
export function createStudioActionDispatcher(options: SiteActionHandlerOptions = {}) {
  const isPreview = options.isPreview ?? true;

  return (actionId: string, payload?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Normalize action type
    let type: SiteActionType = 'navigate';
    if (actionId.startsWith('nav:') || actionId === 'navigate') type = 'navigate';
    else if (actionId.startsWith('scroll:') || actionId === 'scroll_to') type = 'scroll_to';
    else if (actionId.startsWith('tel:') || actionId === 'phone_call') type = 'phone_call';
    else if (actionId.startsWith('wa:') || actionId === 'whatsapp') type = 'whatsapp';
    else if (actionId.startsWith('mailto:') || actionId === 'email') type = 'email';
    else if (actionId === 'submit_form' || actionId === 'form_submit') type = 'submit_form';
    else if (actionId === 'add_to_cart') type = 'add_to_cart';
    else if (actionId === 'open_cart' || actionId === 'view_cart') type = 'open_cart';

    let message = `Action "${type}" triggered.`;
    const target = typeof payload?.target === 'string' ? payload.target : undefined;

    switch (type) {
      case 'navigate': {
        const path = target || (typeof payload?.href === 'string' ? payload.href : '/');
        message = `Navigate to ${path}`;
        if (options.onNavigate) {
          options.onNavigate(path);
        }
        break;
      }
      case 'scroll_to': {
        const anchor = target || (typeof payload?.anchor === 'string' ? payload.anchor : '');
        message = `Scroll to section ${anchor}`;
        if (options.onScrollTo) {
          options.onScrollTo(anchor);
        } else if (typeof document !== 'undefined' && anchor) {
          const el = document.getElementById(anchor.replace(/^#/, ''));
          el?.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      }
      case 'phone_call': {
        const phone = target || (typeof payload?.phone === 'string' ? payload.phone : '');
        message = isPreview ? `[Preview Mode] Simulated Phone Call: ${phone}` : `Dialing ${phone}`;
        if (options.onToast) options.onToast(message);
        break;
      }
      case 'whatsapp': {
        const wa = target || (typeof payload?.whatsapp === 'string' ? payload.whatsapp : '');
        message = isPreview ? `[Preview Mode] Simulated WhatsApp Chat: ${wa}` : `Opening WhatsApp ${wa}`;
        if (options.onToast) options.onToast(message);
        break;
      }
      case 'email': {
        const mail = target || (typeof payload?.email === 'string' ? payload.email : '');
        message = isPreview ? `[Preview Mode] Simulated Email Compose: ${mail}` : `Composing email to ${mail}`;
        if (options.onToast) options.onToast(message);
        break;
      }
      case 'submit_form': {
        message = `[Studio Intake] Simulated lead intake submission. Validation passed.`;
        if (options.onToast) options.onToast('Inquiry recorded in Studio Lead Preview.');
        break;
      }
      case 'add_to_cart': {
        const item = typeof payload?.productName === 'string' ? payload.productName : 'Product';
        message = `[Studio Commerce V1] Simulated add-to-bag: "${item}". Cart updated.`;
        if (options.onToast) options.onToast(`Added "${item}" to Studio cart simulation.`);
        break;
      }
      case 'open_cart': {
        message = `[Studio Commerce V1] Open simulated cart drawer.`;
        if (options.onToast) options.onToast('Opened Studio simulated cart drawer.');
        break;
      }
    }

    const record: SiteActionRecord = {
      id,
      type,
      target,
      payload,
      timestamp,
      status: isPreview ? 'simulated' : 'handled',
      message,
    };

    if (options.onRecordAction) {
      options.onRecordAction(record);
    }

    return record;
  };
}
