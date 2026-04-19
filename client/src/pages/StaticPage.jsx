import React from 'react';
import { Link } from 'react-router-dom';

const pageContent = {
  about: {
    title: 'About Voleena Foods',
    intro: 'Traditional Sri Lankan meals prepared for quick ordering, takeaway, and delivery around Gampaha.',
    sections: [
      {
        heading: 'What we serve',
        body: 'Rice and curry, combo packs, short eats, desserts, and catering-friendly meals for families and teams.'
      },
      {
        heading: 'How we work',
        body: 'Orders move from checkout to kitchen, cashier, and delivery workflows so each team can keep the same order status in view.'
      }
    ]
  },
  contact: {
    title: 'Contact Us',
    intro: 'Reach Voleena Foods for order help, catering questions, or menu updates.',
    sections: [
      {
        heading: 'Location',
        body: 'Kalagedihena, Gampaha District, Sri Lanka'
      },
      {
        heading: 'Phone',
        body: '+94 71 234 5678'
      },
      {
        heading: 'Email',
        body: 'info@voleenafoods.lk'
      }
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'We use customer details only for account access, order handling, delivery updates, support, and required business records.',
    sections: [
      {
        heading: 'Information used',
        body: 'Name, email, phone number, delivery address, order history, feedback, and payment status are used to complete and support orders.'
      },
      {
        heading: 'Data care',
        body: 'Access is limited by staff role, and payment card details are handled by the payment provider instead of being stored in this app.'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    intro: 'By using Voleena Foods ordering, customers agree to provide accurate order and contact details.',
    sections: [
      {
        heading: 'Orders',
        body: 'Orders can be accepted, prepared, delivered, completed, or cancelled based on restaurant availability and order status.'
      },
      {
        heading: 'Payments and refunds',
        body: 'Online payment results are processed through the payment provider, and eligible refunds follow the order cancellation flow.'
      }
    ]
  }
};

// Code Review: Function StaticPage in client\src\pages\StaticPage.jsx. Used in: client/src/pages/StaticPage.jsx, client/src/routes/AppRoutes.jsx.
const StaticPage = ({ page }) => {
  const content = pageContent[page] || pageContent.about;

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary-600 uppercase">Voleena Foods</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{content.title}</h1>
        <p className="mt-4 text-lg text-gray-700">{content.intro}</p>
      </div>

      <div className="space-y-6">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-gray-900">{section.heading}</h2>
            <p className="mt-2 text-gray-700">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/menu"
          className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          View Menu
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default StaticPage;
