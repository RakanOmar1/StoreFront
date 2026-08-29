# Design QA

- Reference: user-provided product-filter, Arabic catalog-heading, Arabic filter-sidebar, and mobile empty-cart screenshots.
- Implementation: language-aware catalog sidebar, compact catalog heading, refined bilingual filter controls, and a redesigned responsive empty-cart experience.
- English behavior: filter sidebar occupies the left catalog column.
- Arabic behavior: RTL direction mirrors the filter sidebar to the right catalog column.
- Responsive behavior: filter controls move above the catalog below 1000px and become single-column below 700px.
- Heading behavior: the result badge stays grouped with the heading in English and Arabic instead of stretching to the opposite viewport edge; it stacks cleanly on narrow phones.
- Filter behavior: known supermarket category labels are translated in Arabic, controls use consistent RTL alignment, and the category list has denser interactive rows with clear selected and hover states.
- Scroll behavior: the desktop/tablet catalog summary uses the same sticky top offset as the filter sidebar and an opaque backing surface; it returns to normal document flow on narrow phones.
- Carousel behavior: PrimeNG's sliding track remains LTR to prevent blank RTL transforms, Arabic headings/cards retain RTL text flow, and both navigation arrow icons are inverted for Arabic.
- Cart behavior: empty cart now has a compact branded header, PrimeIcons, a clear primary action, trust cues, responsive spacing, and mirrored directional arrows in Arabic; populated-cart logic is unchanged.
- Admin mobile behavior: the desktop sidebar offset is removed below 768px in both LTR and RTL, table/profile views use the full viewport width, duplicate top spacing is removed, and wide grid content is constrained to its panel.
- Admin mobile data: AG Grid is replaced below 768px by paginated, tappable record cards showing up to five useful columns; desktop/tablet retain the full grid.
- Order management detail: generic oversized read-only fields are replaced by a bounded order overview with status badges, customer/total/delivery/payment summaries, workflow controls, and product lines; the layout collapses to two and one columns on smaller screens.
- Order details redesign: the dark overview/statusbar presentation is superseded by a commerce-focused header and 70/30 content layout, semantic status badges, consolidated actions, item and total sections, contextual customer/fulfilment/payment cards, compact feedback, and collapsible activity. RTL uses logical spacing and mobile/tablet layouts stack without retaining a permanent chatter column.
- Invoice redesign: printing now renders a dedicated A4 invoice instead of the admin order screen, with a branded invoice header, order/payment badges, billing/delivery/payment blocks, itemized product lines, totals, and a footer. The document uses the current English or Arabic language and inherited LTR/RTL direction.
- Build check: passed (`ng build`).
- Live compilation: passed (`ng serve`).
- Visual screenshot comparison: blocked because no browser capture tool is available in this session.

final result: blocked
