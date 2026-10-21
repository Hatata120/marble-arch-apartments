MARBLE ARCH APARTMENTS · WEBSITE

What is here
  index.html        The home page. Open it in Chrome, Edge or Safari to see the site.
  assets            Styles, scripts, logos, photographs, platform logos and textures.
  media             The London film on the home page and the short films of each place.
  Every other .html file is one page of the site: the apartments, each of the four
  apartment pages, the neighbourhood, owners, about, contact, brand and privacy.

Booking links (Airbnb, Booking.com, Vrbo, Expedia, Plum Guide)
  Open assets/js/data.js in Notepad. Each apartment has a list of platforms. Paste the
  listing address between the quotes after the platform name, for example
      "airbnb": "https://www.airbnb.co.uk/rooms/123456",
  then save. The logo on that apartment page becomes a link that opens the listing in a
  new tab. A platform with empty quotes shows "Link to come". The logos on the home page
  never link anywhere, as requested. The Londoners.com links are already in place.

Enquiry forms
  The owner and guest forms check what is typed, then open the visitor's email app with the
  enquiry written out to info@marble-arch-apartments.com, ready to send. To receive enquiries
  straight into a system instead (an n8n or Zapier webhook, for example), put its address in
  "endpoint" in the same data.js file.

Contact details
  Email info@marble-arch-apartments.com, telephone and WhatsApp +44 7411 555 851. They are
  set in the header menu, footer, contact, about and privacy pages.

Where the site lives
  The live site is served by GitHub Pages from the repository Hatata120/marble-arch-apartments,
  on https://marble-arch-apartments.com with a free certificate that renews by itself.
  To change something, replace the file in that repository; the site updates within a minute.
  The CNAME file holds the domain and must stay in place.

Credits
  City footage: Pexels contributors, under the Pexels licence.
  Apartment photographs: Marble Arch Apartments.
  Typefaces: Bodoni Moda, Jost and Cinzel, under the SIL Open Font License, embedded in
  assets/css/fonts.css.
  Motion: GSAP by GreenSock (free standard licence) and Lenis (MIT licence).
