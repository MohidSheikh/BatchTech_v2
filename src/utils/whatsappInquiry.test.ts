import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATCHTECH_WHATSAPP_NUMBER,
  buildWhatsAppChatUrl,
  formatWhatsAppInquiryMessage,
  validateContactFormValues,
} from './whatsappInquiry.ts';

test('BATCHTECH_WHATSAPP_NUMBER uses international format without leading plus sign', () => {
  assert.equal(BATCHTECH_WHATSAPP_NUMBER, '923188535169');
  assert.equal(BATCHTECH_WHATSAPP_NUMBER.startsWith('+'), false);
});

test('validateContactFormValues rejects empty or invalid inputs and identifies failing field', () => {
  assert.deepEqual(
    validateContactFormValues({
      fullName: ' ',
      businessEmail: 'user@company.com',
      serviceRequired: 'Web Development',
      projectDetails: 'Build a clean marketing site.',
    }),
    {
      valid: false,
      errorField: 'fullName',
      errorMessage: 'Please enter your full name.',
    }
  );

  assert.deepEqual(
    validateContactFormValues({
      fullName: 'Ada Lovelace',
      businessEmail: 'not-an-email',
      serviceRequired: 'Web Development',
      projectDetails: 'Build a clean marketing site.',
    }),
    {
      valid: false,
      errorField: 'businessEmail',
      errorMessage: 'Please enter a valid business email address.',
    }
  );

  assert.deepEqual(
    validateContactFormValues({
      fullName: 'Ada Lovelace',
      businessEmail: 'ada@company.com',
      serviceRequired: '',
      projectDetails: 'Build a clean marketing site.',
    }),
    {
      valid: false,
      errorField: 'serviceRequired',
      errorMessage: 'Please select the service you require.',
    }
  );

  assert.deepEqual(
    validateContactFormValues({
      fullName: 'Ada Lovelace',
      businessEmail: 'ada@company.com',
      serviceRequired: 'Web Development',
      projectDetails: 'Hi',
    }),
    {
      valid: false,
      errorField: 'projectDetails',
      errorMessage: 'Please enter your project details.',
    }
  );
});

test('formatWhatsAppInquiryMessage formats submitted fields cleanly and omits blank optional fields', () => {
  const message = formatWhatsAppInquiryMessage({
    fullName: '  Ada Lovelace ',
    businessEmail: ' ada@analytical.io ',
    companyName: ' Analytical Co ',
    serviceRequired: 'AI & Automation',
    projectDetails: ' Automate our lead intake & CRM sync. ',
  });

  assert.equal(
    message,
    [
      'Hello BatchTech Team,',
      '',
      'New website project inquiry:',
      '',
      'Name: Ada Lovelace',
      'Email: ada@analytical.io',
      'Company / Website: Analytical Co',
      'Service Required: AI & Automation',
      '',
      'Message:',
      'Automate our lead intake & CRM sync.',
    ].join('\n')
  );
});

test('buildWhatsAppChatUrl uses wa.me/923188535169 and URL-encodes special characters', () => {
  const url = buildWhatsAppChatUrl({
    fullName: 'Raza & Co',
    businessEmail: 'raza@example.com',
    companyName: 'https://example.com?ref=1#top',
    serviceRequired: 'Web Development',
    projectDetails: 'Need 100% custom site + workflow?',
  });

  assert.ok(url.startsWith('https://wa.me/923188535169?text='));
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://wa.me');
  assert.equal(parsed.pathname, '/923188535169');
  const decoded = parsed.searchParams.get('text') || '';
  assert.match(decoded, /Name: Raza & Co/);
  assert.match(decoded, /Email: raza@example\.com/);
  assert.match(decoded, /Company \/ Website: https:\/\/example\.com\?ref=1#top/);
  assert.match(decoded, /Service Required: Web Development/);
  assert.match(decoded, /Need 100% custom site \+ workflow\?/);
});
