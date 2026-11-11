// Textes editoriaux bilingues (FR et EN). A modifier ici sans toucher aux pages.
import type { Localized } from '../shared/types'

const L = (fr: string, en: string): Localized => ({ fr, en })

export const HOME = {
  badge: L('Bus Yaoundé, Douala, Kribi', 'Buses Yaoundé, Douala, Kribi'),
  heroTitle: L('Voyagez entre Yaoundé, Douala et Kribi, simplement.', 'Travel between Yaoundé, Douala and Kribi, simply.'),
  heroLead: L(
    'Choisissez votre siège, payez avec Mobile Money et voyagez avec un billet sur votre téléphone.',
    'Pick your seat, pay with Mobile Money and travel with a ticket on your phone.',
  ),
  trust: [
    { icon: 'lucide:smartphone', text: L('Paiement Orange Money et MTN MoMo', 'Orange Money and MTN MoMo payment') },
    { icon: 'lucide:badge-check', text: L('Billet vérifiable en quelques secondes', 'Ticket verifiable in seconds') },
    { icon: 'lucide:wifi', text: L('Wi-Fi et prises USB à bord', 'Wi-Fi and USB sockets on board') },
  ],
  citiesTitle: L('Trois villes, une seule ligne', 'Three cities, one line'),
  citiesLead: L('Chaque ville a son caractère. Choisissez celle où commence votre voyage.', 'Every city has its own character. Pick the one where your trip begins.'),
  routesTitle: L('Les lignes les plus demandées', 'Most popular lines'),
  routesLead: L('Trois villes, des départs tous les jours, dans les deux sens.', 'Three cities, daily departures, both ways.'),
  fromLabel: L('à partir de', 'from'),
  seeTimes: L('Voir les horaires', 'See times'),
  classesTitle: L('Choisissez votre confort', 'Choose your comfort'),
  classesLead: L('Même route, même ponctualité. Seul le confort change.', 'Same road, same punctuality. Only the comfort changes.'),
  chooseClass: L('Choisir cette classe', 'Choose this class'),
  stepsTitle: L('Réserver prend trois minutes', 'Booking takes three minutes'),
  steps: [
    { title: L('Choisissez votre départ', 'Pick your departure'), text: L('Ville, date, horaire et classe. Les places restantes s\'affichent en direct.', 'City, date, time and class. Seats left are shown live.') },
    { title: L('Sélectionnez votre siège', 'Select your seat'), text: L('Un plan du bus, jusqu\'à cinq sièges, retenus pendant dix minutes.', 'A bus seat plan, up to five seats, held for ten minutes.') },
    { title: L('Payez et voyagez', 'Pay and travel'), text: L('Validez sur votre téléphone. Votre billet arrive aussitôt, même sans réseau ensuite.', 'Confirm on your phone. Your ticket arrives at once, readable offline afterwards.') },
  ],
  whyTitle: L('Un voyage sans mauvaise surprise', 'A trip without bad surprises'),
  why: [
    { icon: 'lucide:shield-check', tone: 'yde', title: L('Sécurité maximale', 'Maximum safety'), text: L('Chauffeurs expérimentés, véhicules contrôlés chaque semaine.', 'Experienced drivers, vehicles checked every week.') },
    { icon: 'lucide:timer', tone: 'dla', title: L('Ponctualité', 'Punctuality'), text: L('Zéro retard au départ: le bus part à l\'heure du billet.', 'Zero delay at departure: the bus leaves at the ticket time.') },
    { icon: 'lucide:sofa', tone: 'kri', title: L('Confort premium', 'Premium comfort'), text: L('Climatisation, Wi-Fi, prises USB, sièges inclinables.', 'Air conditioning, Wi-Fi, USB sockets, reclining seats.') },
    { icon: 'lucide:headset', tone: 'yde', title: L('Support 7j/7', 'Support 7 days a week'), text: L('Une équipe joignable de 6h à 22h, au téléphone ou sur WhatsApp.', 'A team reachable from 6am to 10pm, by phone or on WhatsApp.') },
  ],
  numbers: [
    { to: 12, suffix: L(' bus', ' buses'), label: L('à double étage', 'double-deckers') },
    { to: 6, suffix: L(' lignes', ' lines'), label: L('dans les deux sens', 'both ways') },
    { to: 4.8, suffix: L(' sur 5', ' out of 5'), label: L('note moyenne des voyageurs', 'average traveller rating') },
    { to: 7, suffix: L('j/7', '/7'), label: L('service client de 6h à 22h', 'customer service 6am to 10pm') },
  ],
  ticketTitle: L('Un billet qui se vérifie en dix secondes', 'A ticket you can verify in ten seconds'),
  ticketText: L(
    'Chaque billet porte un PNR et un QR code. N\'importe qui peut en vérifier l\'authenticité, sans jamais voir le nom ni le téléphone du voyageur.',
    'Every ticket carries a PNR and a QR code. Anyone can check it is genuine, without ever seeing the traveller\'s name or phone.',
  ),
  verifyCta: L('Vérifier un billet', 'Verify a ticket'),
  tripCta: L('Retrouver mon voyage', 'Find my trip'),
  faqTitle: L('Questions fréquentes', 'Frequently asked questions'),
  faqAll: L('Toutes les réponses', 'All answers'),
  finalTitle: L('Votre place vous attend.', 'Your seat is waiting.'),
  finalText: L('Réservez en quelques minutes, payez depuis votre téléphone.', 'Book in minutes, pay from your phone.'),
  finalCta: L('Réserver un billet', 'Book a ticket'),
}

export const CLASSES_PAGE = {
  title: L('Trois façons de voyager', 'Three ways to travel'),
  lead: L('Même route, même ponctualité. Le confort fait la différence.', 'Same road, same punctuality. Comfort makes the difference.'),
  fromPrice: L('À partir de', 'From'),
  layout: L('Disposition', 'Layout'),
  seats: L('Sièges', 'Seats'),
  rows: L('Rangées', 'Rows'),
  bookClass: L('Réserver cette classe', 'Book this class'),
  compare: L('Comparer les équipements', 'Compare equipment'),
  included: L('Inclus', 'Included'),
  notIncluded: L('Non inclus', 'Not included'),
  stories: {
    business: L(
      'Sièges confortables en 2+2, climatisation, télé et casse-croûte. Tout l\'essentiel, au meilleur prix.',
      'Comfortable 2+2 seats, air conditioning, TV and a snack. Everything essential, at the best price.',
    ),
    'masterclass-s': L(
      'Fauteuils inclinables en 2+1, écran personnel, boisson offerte. Plus d\'espace, moins de fatigue.',
      'Reclining 2+1 armchairs, personal screen, free drink. More room, less fatigue.',
    ),
    'masterclass-plus': L(
      'Sièges-lits, repas complet, Wi-Fi, Netflix et coussin de voyage. Vous arrivez reposé.',
      'Lie-flat seats, full meal, Wi-Fi, Netflix and a travel pillow. You arrive rested.',
    ),
  },
}

export const ONBOARD = {
  title: L('À bord, tout est pensé', 'On board, everything is thought through'),
  lead: L('Faites défiler: voici ce qui vous attend entre le départ et l\'arrivée.', 'Scroll on: here is what awaits between departure and arrival.'),
  panels: [
    { id: 'meal-onboard', icon: 'lucide:utensils', title: L('À table à bord', 'Dining on board'), text: L('Casse-croûte en Business, boisson offerte en MasterClass S, repas complet en MasterClass Plus.', 'A snack in Business, a free drink in MasterClass S, a full meal in MasterClass Plus.') },
    { id: 'seats-leather', icon: 'lucide:armchair', title: L('Sièges inclinables', 'Reclining seats'), text: L('Cuir, accoudoirs larges, et des sièges-lits en MasterClass Plus pour dormir vraiment.', 'Leather, wide armrests, and lie-flat seats in MasterClass Plus so you truly sleep.') },
    { id: 'entertainment', icon: 'lucide:clapperboard', title: L('Divertissement', 'Entertainment'), text: L('Films, musique et masterclass en direct. Netflix et écran personnel en MasterClass Plus.', 'Films, music and live masterclasses. Netflix and a personal screen in MasterClass Plus.') },
    { id: 'usb-sockets', icon: 'lucide:plug', title: L('Une prise à chaque siège', 'A socket at every seat'), text: L('Prises USB pour tous, borne de recharge rapide, écouteurs et coussin de voyage en Premium.', 'USB sockets for everyone, a fast charging point, headphones and travel pillow in Premium.') },
    { id: 'bio-safe', icon: 'lucide:shield-check', title: L('Certifié Bio Safe', 'Bio Safe certified'), text: L('Bus nettoyés et inspectés, chauffeurs expérimentés, contrôles chaque semaine.', 'Cleaned and inspected buses, experienced drivers, weekly checks.') },
    { id: 'fleet-double-deck', icon: 'lucide:bus', title: L('Flotte double-étage', 'Double-decker fleet'), text: L('Wi-Fi, climatisation et ambiance conviviale du premier au dernier kilomètre.', 'Wi-Fi, air conditioning and a friendly mood from the first kilometre to the last.') },
  ],
  videosTitle: L('En images', 'In pictures'),
  videos: [
    { title: L('À table à bord', 'Dining on board'), text: L('Le service de restauration, du plateau au dessert.', 'The catering service, from tray to dessert.') },
    { title: L('En direct de la MasterClass', 'Live from the MasterClass'), text: L('Une ambiance de salon, à 100 km/h.', 'A lounge atmosphere at 100 km/h.') },
  ],
}

export const ABOUT = {
  title: L('Une autre vision du voyage', 'A different vision of travel'),
  lead: L(
    'MEN TRAVEL relie Yaoundé, Douala et Kribi avec des bus à double étage, des horaires tenus et un confort qui change le trajet.',
    'MEN TRAVEL connects Yaoundé, Douala and Kribi with double-decker buses, kept timetables and comfort that changes the ride.',
  ),
  story: [
    L('Nous sommes partis d\'un constat simple: la route entre les grandes villes du Cameroun mérite mieux qu\'une attente incertaine et un siège inconnu.', 'We started from a simple observation: the road between Cameroon\'s big cities deserves better than an uncertain wait and an unknown seat.'),
    L('Depuis plus de dix ans, nos équipes ont affiné les horaires, la maintenance et l\'accueil. Aujourd\'hui, vous choisissez votre siège sur un plan, vous payez avec votre téléphone, et votre billet vous suit partout.', 'For over ten years our teams have refined timetables, maintenance and welcome. Today you pick your seat on a plan, pay with your phone, and your ticket follows you everywhere.'),
    L('Nos bus sont inspectés régulièrement, nos chauffeurs sont expérimentés, et des milliers de passagers nous font confiance chaque jour.', 'Our buses are regularly inspected, our drivers are experienced, and thousands of passengers trust us every day.'),
  ],
  figures: [
    { value: L('10+', '10+'), label: L('ans d\'expérience', 'years of experience') },
    { value: L('12', '12'), label: L('bus à double étage', 'double-deckers') },
    { value: L('6', '6'), label: L('lignes entre 3 villes', 'lines between 3 cities') },
    { value: L('7j/7', '7/7'), label: L('service client de 6h à 22h', 'customer service 6am to 10pm') },
  ],
  agenciesTitle: L('Nos agences', 'Our agencies'),
}

export interface FaqItem {
  id: string
  group: 'booking' | 'ticket' | 'travel' | 'services'
  q: Localized
  a: Localized
}

export const FAQ: FaqItem[] = [
  { id: 'how', group: 'booking', q: L('Comment réserver un billet ?', 'How do I book a ticket?'), a: L('Choisissez votre ville de départ, votre destination et votre date. Sélectionnez ensuite la classe, l\'horaire et vos sièges, saisissez le titulaire, puis payez avec Orange Money ou MTN MoMo.', 'Pick your departure city, destination and date. Then choose the class, time and seats, enter the passenger, and pay with Orange Money or MTN MoMo.') },
  { id: 'holder', group: 'booking', q: L('Dois-je saisir tous les passagers ?', 'Do I have to enter every passenger?'), a: L('Non. Un seul titulaire suffit, quel que soit le nombre de sièges (jusqu\'à 5). Il s\'identifie avec son nom, son téléphone et un numéro de pièce d\'identité.', 'No. A single passenger is enough, whatever the number of seats (up to 5). They identify with a name, phone and an ID document number.') },
  { id: 'hold', group: 'booking', q: L('Combien de temps mes sièges sont-ils retenus ?', 'How long are my seats held?'), a: L('10 minutes à partir du moment où vous choisissez un siège. Un compte à rebours reste visible en haut de l\'écran, et vous pouvez reprendre les mêmes sièges s\'ils sont encore libres.', '10 minutes from the moment you pick a seat. A countdown stays visible at the top of the screen, and you can take the same seats again if they are still free.') },
  { id: 'payment', group: 'booking', q: L('Quels moyens de paiement ?', 'Which payment methods?'), a: L('Orange Money et MTN MoMo. Vous recevez une demande de validation sur votre téléphone. Sans notification, composez #150# (Orange) ou *126# (MTN).', 'Orange Money and MTN MoMo. You receive a confirmation request on your phone. Without a notification, dial #150# (Orange) or *126# (MTN).') },
  { id: 'confirm', group: 'ticket', q: L('Comment savoir que ma réservation est confirmée ?', 'How do I know my booking is confirmed?'), a: L('Dès la validation du paiement, votre billet s\'affiche avec son PNR (par exemple MT-K7N2QX-4HDM). Vous pouvez le télécharger, le partager sur WhatsApp, et le retrouver sur la page Mon voyage.', 'As soon as the payment is validated, your ticket appears with its PNR (for example MT-K7N2QX-4HDM). You can download it, share it on WhatsApp, and find it on the My trip page.') },
  { id: 'verify', group: 'ticket', q: L('Comment vérifier un billet ?', 'How do I verify a ticket?'), a: L('Saisissez le PNR sur la page Vérifier un billet, ou scannez le QR code. Vous voyez le trajet, l\'horaire et les sièges. Le nom, le téléphone et la pièce d\'identité restent masqués.', 'Enter the PNR on the Verify a ticket page, or scan the QR code. You see the route, time and seats. Name, phone and ID number stay hidden.') },
  { id: 'unlock', group: 'ticket', q: L('Comment voir mon billet en entier ?', 'How do I see my ticket in full?'), a: L('Sur Mon voyage, saisissez votre PNR puis le numéro de la pièce d\'identité utilisée à la réservation. Après plusieurs erreurs, l\'accès est bloqué quelques minutes.', 'On My trip, enter your PNR then the ID document number used for the booking. After several mistakes, access is blocked for a few minutes.') },
  { id: 'change', group: 'travel', q: L('Puis-je annuler ou modifier ?', 'Can I cancel or change?'), a: L('Oui, en contactant le service client par téléphone ou WhatsApp au moins 24 heures avant le départ.', 'Yes, by contacting customer service by phone or WhatsApp at least 24 hours before departure.') },
  { id: 'baggage', group: 'travel', q: L('Quels bagages sont inclus ?', 'Which baggage is included?'), a: L('Un bagage cabine de 7 kg maximum et une valise en soute de 20 kg maximum. Un supplément peut s\'appliquer au-delà.', 'One cabin bag up to 7 kg and one hold suitcase up to 20 kg. A supplement may apply beyond that.') },
  { id: 'missed', group: 'travel', q: L('J\'ai raté mon bus, que faire ?', 'I missed my bus, what now?'), a: L('Présentez-vous à l\'agence dans les 24 heures. Une nouvelle place vous est proposée selon les disponibilités.', 'Come to the agency within 24 hours. A new seat is offered subject to availability.') },
  { id: 'wifi', group: 'services', q: L('Y a-t-il du Wi-Fi à bord ?', 'Is there Wi-Fi on board?'), a: L('Oui, dans toute la flotte double-étage. Les prises USB sont disponibles à chaque siège.', 'Yes, across the double-decker fleet. USB sockets are available at every seat.') },
  { id: 'parcels', group: 'services', q: L('Puis-je envoyer un colis ?', 'Can I send a parcel?'), a: L('Oui, via le service Colis: déposez-le à l\'agence de Nylon Bastos ou en agence partenaire, le destinataire le retire à l\'agence d\'arrivée.', 'Yes, with the Parcels service: drop it at the Nylon Bastos agency or a partner agency, the recipient collects it at the arrival agency.') },
  { id: 'charter', group: 'services', q: L('Puis-je louer un bus pour un groupe ?', 'Can I hire a bus for a group?'), a: L('Oui, de 15 à 70 places. Demandez un devis gratuit et sans engagement: réponse sous 24 heures ouvrées.', 'Yes, from 15 to 70 seats. Ask for a free, no-obligation quote: reply within 24 working hours.') },
]

export const FAQ_GROUPS: Record<FaqItem['group'], Localized> = {
  booking: L('Réserver', 'Booking'),
  ticket: L('Mon billet', 'My ticket'),
  travel: L('Voyager', 'Travelling'),
  services: L('Services', 'Services'),
}

export interface LegalSection {
  title: Localized
  body: Localized[]
}

export const TERMS: LegalSection[] = [
  { title: L('1. Objet', '1. Purpose'), body: [L('Les présentes conditions régissent la vente de billets de transport de voyageurs par MEN TRAVEL sur les lignes Yaoundé, Douala et Kribi.', 'These terms govern the sale of passenger transport tickets by MEN TRAVEL on the Yaoundé, Douala and Kribi lines.')] },
  { title: L('2. Réservation', '2. Booking'), body: [L('La réservation porte sur un départ, une classe et un à cinq sièges, au nom d\'un seul titulaire. Les sièges sont retenus 10 minutes pendant la réservation. Un billet n\'est valable qu\'une fois le paiement validé.', 'A booking covers one departure, one class and one to five seats, in the name of a single passenger. Seats are held for 10 minutes during booking. A ticket is valid only once payment is validated.')] },
  { title: L('3. Paiement', '3. Payment'), body: [L('Le paiement s\'effectue en francs CFA par Orange Money ou MTN MoMo. Le montant affiché est le montant total, sans frais cachés.', 'Payment is made in CFA francs by Orange Money or MTN MoMo. The amount shown is the total, with no hidden fees.')] },
  { title: L('4. Bagages', '4. Baggage'), body: [L('Chaque passager dispose d\'un bagage cabine (7 kg maximum) et d\'une valise en soute (20 kg maximum). Un supplément peut être demandé au-delà.', 'Each passenger has one cabin bag (7 kg maximum) and one hold suitcase (20 kg maximum). A supplement may be requested beyond that.')] },
  { title: L('5. Annulation et modification', '5. Cancellation and changes'), body: [L('Toute annulation ou modification se demande au moins 24 heures avant le départ, auprès du service client. Le remboursement dépend du délai et de la classe, selon la page Bagages et annulation.', 'Any cancellation or change must be requested at least 24 hours before departure from customer service. The refund depends on timing and class, as set out on the Baggage and cancellation page.')] },
  { title: L('6. Responsabilité', '6. Liability'), body: [L('MEN TRAVEL s\'engage à transporter le voyageur en sécurité à l\'heure prévue. Sa responsabilité est limitée aux cas prévus par la loi en vigueur au Cameroun.', 'MEN TRAVEL undertakes to carry the traveller safely at the scheduled time. Its liability is limited to the cases provided by the law in force in Cameroon.')] },
  { title: L('7. Données personnelles', '7. Personal data'), body: [L('Nous collectons le nom, le prénom, le téléphone et un numéro de pièce d\'identité pour émettre et protéger le billet. Voir la page Confidentialité.', 'We collect name, first name, phone and an ID document number to issue and protect the ticket. See the Privacy page.')] },
  { title: L('8. Contact', '8. Contact'), body: [L('Service client: +237 6 53 67 74 43, WhatsApp, ou contact@men-travel.cm, 7j/7 de 6h à 22h.', 'Customer service: +237 6 53 67 74 43, WhatsApp, or contact@men-travel.cm, 7 days a week 6am to 10pm.')] },
]

export const BAGGAGE: LegalSection[] = [
  { title: L('Bagages inclus', 'Included baggage'), body: [L('Un bagage cabine de 7 kg maximum, à garder avec vous, et une valise en soute de 20 kg maximum. Les objets de valeur restent en cabine.', 'One cabin bag up to 7 kg, kept with you, and one hold suitcase up to 20 kg. Valuables stay in the cabin.'), L('Au-delà, un supplément peut s\'appliquer selon le poids et la place disponible en soute.', 'Beyond that, a supplement may apply depending on weight and hold space.')] },
  { title: L('Annulation', 'Cancellation'), body: [L('Plus de 48 heures avant le départ: remboursement de 80 % du billet. Entre 24 et 48 heures: 50 %. Moins de 24 heures: aucun remboursement.', 'More than 48 hours before departure: 80% of the ticket refunded. Between 24 and 48 hours: 50%. Under 24 hours: no refund.'), L('Le remboursement se fait sur le numéro Mobile Money utilisé pour payer, sous 72 heures ouvrées.', 'Refunds go to the Mobile Money number used to pay, within 72 working hours.')] },
  { title: L('Modification', 'Changes'), body: [L('Un changement de date ou d\'horaire est gratuit une fois, jusqu\'à 24 heures avant le départ, selon les places disponibles. Une différence de tarif peut s\'appliquer si vous changez de classe.', 'A change of date or time is free once, up to 24 hours before departure, subject to available seats. A fare difference may apply if you change class.')] },
  { title: L('Bus raté', 'Missed bus'), body: [L('Présentez-vous à l\'agence dans les 24 heures suivant le départ. Une nouvelle place vous est proposée selon les disponibilités, sans frais la première fois.', 'Come to the agency within 24 hours after departure. A new seat is offered subject to availability, free the first time.')] },
]

export const PRIVACY: LegalSection[] = [
  { title: L('Ce que nous collectons', 'What we collect'), body: [L('Pour chaque réservation: nom, prénom, numéro de téléphone et numéro d\'une pièce d\'identité (carte, passeport ou autre). Pour les colis et les devis: coordonnées de l\'expéditeur, du destinataire et du demandeur.', 'For each booking: last name, first name, phone number and the number of an ID document (card, passport or other). For parcels and quotes: details of the sender, recipient and requester.')] },
  { title: L('Pourquoi', 'Why'), body: [L('Pour émettre le billet, vous joindre en cas de changement, et protéger l\'accès au billet complet: seul le titulaire, avec son numéro de pièce, peut le voir en entier.', 'To issue the ticket, reach you if something changes, and protect access to the full ticket: only the holder, with their document number, can see it in full.')] },
  { title: L('Ce qui reste masqué', 'What stays hidden'), body: [L('La vérification publique d\'un billet n\'affiche jamais le nom, le téléphone ou la pièce d\'identité en clair. Ces informations sont masquées par nos serveurs avant l\'envoi.', 'Public ticket verification never shows name, phone or ID in clear. Our servers mask this information before it is sent.')] },
  { title: L('Durée de conservation', 'Retention'), body: [L('Les données de réservation sont conservées 24 mois après le voyage, puis supprimées ou anonymisées.', 'Booking data is kept 24 months after the trip, then deleted or anonymised.')] },
  { title: L('Vos droits', 'Your rights'), body: [L('Vous pouvez demander l\'accès, la correction ou la suppression de vos données à contact@men-travel.cm.', 'You can request access, correction or deletion of your data at contact@men-travel.cm.')] },
]
