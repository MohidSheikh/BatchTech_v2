export const BATCHTECH_WHATSAPP_NUMBER = '923188535169';

export interface ContactInquiryFormValues {
  fullName: string;
  businessEmail: string;
  companyName?: string;
  phoneNumber?: string;
  serviceRequired: string;
  subject?: string;
  projectDetails: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errorField?: 'fullName' | 'businessEmail' | 'serviceRequired' | 'projectDetails';
  errorMessage?: string;
  normalized?: {
    fullName: string;
    businessEmail: string;
    companyName: string;
    phoneNumber: string;
    serviceRequired: string;
    subject: string;
    projectDetails: string;
  };
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateContactFormValues(
  values: ContactInquiryFormValues
): ContactValidationResult {
  const fullName = String(values.fullName || '').trim();
  const businessEmail = String(values.businessEmail || '').trim();
  const companyName = String(values.companyName || '').trim();
  const phoneNumber = String(values.phoneNumber || '').trim();
  const serviceRequired = String(values.serviceRequired || '').trim();
  const subject = String(values.subject || '').trim();
  const projectDetails = String(values.projectDetails || '').trim();

  if (fullName.length < 2) {
    return {
      valid: false,
      errorField: 'fullName',
      errorMessage: 'Please enter your full name.',
    };
  }
  if (!EMAIL_REGEX.test(businessEmail)) {
    return {
      valid: false,
      errorField: 'businessEmail',
      errorMessage: 'Please enter a valid business email address.',
    };
  }
  if (!serviceRequired) {
    return {
      valid: false,
      errorField: 'serviceRequired',
      errorMessage: 'Please select the service you require.',
    };
  }
  if (projectDetails.length < 5) {
    return {
      valid: false,
      errorField: 'projectDetails',
      errorMessage: 'Please enter your project details.',
    };
  }

  return {
    valid: true,
    normalized: {
      fullName,
      businessEmail,
      companyName,
      phoneNumber,
      serviceRequired,
      subject,
      projectDetails,
    },
  };
}

export function formatWhatsAppInquiryMessage(values: ContactInquiryFormValues): string {
  const validation = validateContactFormValues(values);
  if (!validation.valid || !validation.normalized) {
    throw new Error(validation.errorMessage || 'Invalid contact inquiry values.');
  }

  const data = validation.normalized;
  const lines = [
    'Hello BatchTech Team,',
    '',
    'New website project inquiry:',
    '',
    `Name: ${data.fullName}`,
    `Email: ${data.businessEmail}`,
  ];

  if (data.phoneNumber) {
    lines.push(`Phone Number: ${data.phoneNumber}`);
  }
  if (data.companyName) {
    lines.push(`Company / Website: ${data.companyName}`);
  }
  if (data.subject && data.subject !== data.serviceRequired) {
    lines.push(`Subject: ${data.subject}`);
  }
  lines.push(`Service Required: ${data.serviceRequired}`);
  lines.push('');
  lines.push('Message:');
  lines.push(data.projectDetails);

  return lines.join('\n');
}

export function buildWhatsAppChatUrl(
  values: ContactInquiryFormValues,
  phoneNumber = BATCHTECH_WHATSAPP_NUMBER
): string {
  const cleanDigits = phoneNumber.replace(/[^\d]/g, '');
  const message = formatWhatsAppInquiryMessage(values);
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}
