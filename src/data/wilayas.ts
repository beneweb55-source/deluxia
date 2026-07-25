/**
 * Référentiel des wilayas — noms, communes et grille tarifaire d'origine
 * (tarifs ZR Express fournis par le client).
 *
 * ⚠ Ce fichier n'est PAS la source des tarifs appliqués aux commandes.
 * Les montants facturés proviennent de la table `delivery_rates`, modifiable
 * depuis l'administration : voir `@/lib/delivery-rates`. Cette grille sert de
 * valeur d'amorçage (seed), de repli si la table est vide, et de source pour
 * les listes de communes, qui elles ne bougent jamais.
 *
 * Règles métier encodées dans les données :
 *
 *  1. `hasDesk: false` → la wilaya n'a pas de bureau ZR Express. Le tarif figurait
 *     à 0 DA dans la grille : ce zéro signifie « pas de bureau », pas « gratuit ».
 *  2. `isServed: false` → wilaya absente de la grille ZR Express : aucune livraison
 *     possible. La wilaya reste sélectionnable mais le checkout la refuse avec un
 *     message clair, plutôt que de la faire disparaître, ce qui inquiète la cliente.
 *  3. Alger (16) est absente de la grille « hors wilaya d'Alger ». Règle spécifique
 *     du client : 500 DA à domicile comme en bureau.
 *
 * `returnFee` est le coût d'un retour facturé au marchand : information interne,
 * affichée dans l'administration uniquement, jamais côté boutique.
 */

export interface Wilaya {
  /** Code officiel de la wilaya (1 → 58). */
  code: number;
  name: string;
  nameAr: string;
  /** Frais de livraison à domicile, en DA. */
  homeFee: number;
  /** Frais de livraison en bureau (stop desk), en DA. */
  deskFee: number;
  /** Faux si aucun bureau ZR Express n'existe dans la wilaya. */
  hasDesk: boolean;
  /** Frais de retour supportés par le marchand, en DA. Usage interne. */
  returnFee: number;
  /** Faux si ZR Express ne dessert pas la wilaya. */
  isServed: boolean;
  /** Délai indicatif en jours ouvrés. */
  delay: [min: number, max: number];
  communes: string[];
}

export const WILAYAS: readonly Wilaya[] = [
  {
    code: 1, name: 'Adrar', nameAr: 'أدرار',
    homeFee: 1400, deskFee: 900, hasDesk: true, returnFee: 200, isServed: true, delay: [4, 7],
    communes: ['Adrar', 'Reggane', 'Aoulef', 'Zaouiet Kounta', 'Fenoughil', 'Tsabit', 'Bouda', 'Timiaouine', 'In Zghmir', 'Tamest', 'Sali', 'Akabli'],
  },
  {
    code: 2, name: 'Chlef', nameAr: 'الشلف',
    homeFee: 850, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Chlef', 'Ténès', 'Ouled Fares', 'Boukadir', 'El Karimia', 'Oued Fodda', 'Abou El Hassan', 'Zeboudja', 'Sobha', 'Beni Haoua', 'Chettia', 'Sendjas', 'Ouled Ben Abdelkader', 'Aïn Merane', 'Taougrit'],
  },
  {
    code: 3, name: 'Laghouat', nameAr: 'الأغواط',
    homeFee: 950, deskFee: 550, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Laghouat', 'Aflou', 'Ksar El Hirane', 'Hassi R\'Mel', 'Aïn Madhi', 'Brida', 'El Ghicha', 'Gueltat Sidi Saad', 'Sidi Makhlouf', 'Tadjemout', 'Hassi Delaa', 'Oued Morra'],
  },
  {
    code: 4, name: 'Oum El Bouaghi', nameAr: 'أم البواقي',
    homeFee: 850, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Oum El Bouaghi', 'Aïn Beïda', 'Aïn M\'lila', 'Aïn Fakroun', 'Meskiana', 'Sigus', 'Aïn Kercha', 'F\'kirina', 'Souk Naamane', 'Dhala', 'Ksar Sbahi', 'Bir Chouhada'],
  },
  {
    code: 5, name: 'Batna', nameAr: 'باتنة',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Batna', 'Barika', 'Merouana', 'Arris', 'N\'Gaous', 'Aïn Touta', 'Tazoult', 'Timgad', 'Seriana', 'Chemora', 'Ras El Aioun', 'El Madher', 'Bouzina', 'Ichmoul', 'Menaa', 'Djezzar'],
  },
  {
    code: 6, name: 'Béjaïa', nameAr: 'بجاية',
    homeFee: 800, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Béjaïa', 'Akbou', 'Kherrata', 'Sidi Aïch', 'El Kseur', 'Amizour', 'Tichy', 'Aokas', 'Souk El Tenine', 'Seddouk', 'Ighil Ali', 'Chemini', 'Darguina', 'Melbou', 'Tazmalt', 'Barbacha', 'Adekar'],
  },
  {
    code: 7, name: 'Biskra', nameAr: 'بسكرة',
    homeFee: 950, deskFee: 550, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Biskra', 'Tolga', 'Sidi Okba', 'Ouled Djellal', 'El Kantara', 'Zeribet El Oued', 'M\'Chouneche', 'Foughala', 'Djemorah', 'Chetma', 'El Outaya', 'Branis', 'Lioua'],
  },
  {
    code: 8, name: 'Béchar', nameAr: 'بشار',
    homeFee: 1100, deskFee: 650, hasDesk: true, returnFee: 150, isServed: true, delay: [4, 7],
    communes: ['Béchar', 'Kenadsa', 'Abadla', 'Taghit', 'Lahmar', 'Béni Ounif', 'Boukais', 'Mogheul', 'Tabelbala', 'Igli', 'Meridja'],
  },
  {
    code: 9, name: 'Blida', nameAr: 'البليدة',
    homeFee: 600, deskFee: 400, hasDesk: true, returnFee: 150, isServed: true, delay: [1, 3],
    communes: ['Blida', 'Boufarik', 'Bougara', 'Larbaa', 'Mouzaïa', 'El Affroun', 'Meftah', 'Ouled Yaïch', 'Beni Mered', 'Chiffa', 'Souma', 'Chebli', 'Oued Alleug', 'Bouinan', 'Ben Khelil', 'Guerrouaou'],
  },
  {
    code: 10, name: 'Bouira', nameAr: 'البويرة',
    homeFee: 700, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Bouira', 'Lakhdaria', 'Sour El Ghozlane', 'M\'Chedallah', 'Aïn Bessem', 'Bechloul', 'Kadiria', 'Bordj Okhriss', 'El Hachimia', 'Haizer', 'Bir Ghbalou', 'Chorfa', 'Aomar', 'Djebahia'],
  },
  {
    code: 11, name: 'Tamanrasset', nameAr: 'تمنراست',
    homeFee: 1600, deskFee: 1050, hasDesk: true, returnFee: 250, isServed: true, delay: [5, 9],
    communes: ['Tamanrasset', 'Abalessa', 'In Ghar', 'Idles', 'Tazrouk', 'Tin Zaouatine'],
  },
  {
    code: 12, name: 'Tébessa', nameAr: 'تبسة',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Tébessa', 'Bir El Ater', 'Cheria', 'El Aouinet', 'Morsott', 'Ouenza', 'El Kouif', 'Negrine', 'Bekkaria', 'Hammamet', 'El Ma Labiodh', 'Boulhaf Dir'],
  },
  {
    code: 13, name: 'Tlemcen', nameAr: 'تلمسان',
    homeFee: 900, deskFee: 500, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Tlemcen', 'Maghnia', 'Remchi', 'Ghazaouet', 'Sebdou', 'Nedroma', 'Hennaya', 'Chetouane', 'Mansourah', 'Bensekrane', 'Ouled Mimoun', 'Beni Boussaid', 'Marsa Ben M\'Hidi', 'Sabra', 'Bab El Assa'],
  },
  {
    code: 14, name: 'Tiaret', nameAr: 'تيارت',
    homeFee: 850, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Tiaret', 'Frenda', 'Sougueur', 'Mahdia', 'Ksar Chellala', 'Aïn Deheb', 'Rahouia', 'Dahmouni', 'Mechraa Safa', 'Medroussa', 'Hamadia', 'Oued Lilli', 'Tousnina'],
  },
  {
    code: 15, name: 'Tizi Ouzou', nameAr: 'تيزي وزو',
    homeFee: 750, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Tizi Ouzou', 'Azazga', 'Draa Ben Khedda', 'Boghni', 'Larbaa Nath Irathen', 'Tigzirt', 'Azeffoun', 'Draa El Mizan', 'Ouadhias', 'Ain El Hammam', 'Mekla', 'Freha', 'Beni Douala', 'Maatkas', 'Tizi Rached', 'Ouaguenoun', 'Tizi Gheniff'],
  },
  {
    // Règle spécifique du client : 500 DA quel que soit le mode de livraison.
    code: 16, name: 'Alger', nameAr: 'الجزائر',
    homeFee: 500, deskFee: 500, hasDesk: true, returnFee: 150, isServed: true, delay: [1, 2],
    communes: ['Alger Centre', 'Bab El Oued', 'Hussein Dey', 'El Harrach', 'Bir Mourad Raïs', 'Kouba', 'Bab Ezzouar', 'Dar El Beïda', 'Rouiba', 'Reghaïa', 'Baraki', 'Bourouba', 'El Madania', 'Sidi M\'Hamed', 'Belouizdad', 'El Biar', 'Bouzareah', 'Ben Aknoun', 'Hydra', 'Birkhadem', 'Draria', 'Chéraga', 'Dely Ibrahim', 'Ouled Fayet', 'Aïn Benian', 'Staoueli', 'Zeralda', 'Mahelma', 'Rahmania', 'Souidania', 'Birtouta', 'Tessala El Merdja', 'Bordj El Kiffan', 'Bordj El Bahri', 'El Marsa', 'Aïn Taya', 'Heraoua', 'Mohammadia', 'Bachdjerrah', 'Oued Smar', 'Les Eucalyptus', 'Sidi Moussa', 'Saoula', 'Gué de Constantine', 'Beni Messous', 'Hammamet', 'Raïs Hamidou', 'Oued Koriche', 'Casbah', 'El Mouradia', 'Bologhine'],
  },
  {
    code: 17, name: 'Djelfa', nameAr: 'الجلفة',
    homeFee: 950, deskFee: 500, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Djelfa', 'Aïn Oussera', 'Messaad', 'Hassi Bahbah', 'El Idrissia', 'Charef', 'Dar Chioukh', 'Birine', 'Sidi Ladjel', 'Aïn El Ibel', 'Had Sahary', 'Faidh El Botma', 'Zaccar'],
  },
  {
    code: 18, name: 'Jijel', nameAr: 'جيجل',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Jijel', 'Taher', 'El Milia', 'Chekfa', 'El Ancer', 'Sidi Marouf', 'Ziama Mansouriah', 'Texenna', 'Settara', 'Emir Abdelkader', 'Kaous', 'Djimla'],
  },
  {
    code: 19, name: 'Sétif', nameAr: 'سطيف',
    homeFee: 800, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Sétif', 'El Eulma', 'Aïn Oulmene', 'Bougaa', 'Aïn Arnat', 'Aïn Azel', 'Djemila', 'Beni Aziz', 'Guenzet', 'Salah Bey', 'Amoucha', 'Hammam Guergour', 'Babor', 'Bouandas', 'Aïn El Kebira', 'El Ouricia'],
  },
  {
    code: 20, name: 'Saïda', nameAr: 'سعيدة',
    homeFee: 900, deskFee: 500, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Saïda', 'Aïn El Hadjar', 'Youb', 'Sidi Boubekeur', 'El Hassasna', 'Ouled Brahim', 'Hounet', 'Doui Thabet', 'Tircine', 'Moulay Larbi'],
  },
  {
    code: 21, name: 'Skikda', nameAr: 'سكيكدة',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Skikda', 'Azzaba', 'Collo', 'El Harrouch', 'Tamalous', 'Ramdane Djamel', 'Ben Azzouz', 'Sidi Mezghiche', 'Aïn Kechra', 'El Hadaiek', 'Filfila', 'Ouled Attia'],
  },
  {
    code: 22, name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Sidi Bel Abbès', 'Telagh', 'Sfisef', 'Ben Badis', 'Ras El Ma', 'Mostefa Ben Brahim', 'Tenira', 'Sidi Lahcene', 'Aïn El Berd', 'Marhoum', 'Merine', 'Moulay Slissen'],
  },
  {
    code: 23, name: 'Annaba', nameAr: 'عنابة',
    homeFee: 850, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Annaba', 'El Bouni', 'El Hadjar', 'Sidi Amar', 'Berrahal', 'Chetaibi', 'Seraidi', 'Aïn Berda', 'Oued El Aneb', 'Treat', 'Cheurfa', 'El Eulma'],
  },
  {
    code: 24, name: 'Guelma', nameAr: 'قالمة',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Guelma', 'Oued Zenati', 'Bouchegouf', 'Héliopolis', 'Hammam Debagh', 'Aïn Makhlouf', 'Khezara', 'Hammam N\'Bail', 'Belkheir', 'Medjez Amar', 'Ras El Agba'],
  },
  {
    code: 25, name: 'Constantine', nameAr: 'قسنطينة',
    homeFee: 800, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Constantine', 'El Khroub', 'Aïn Smara', 'Hamma Bouziane', 'Didouche Mourad', 'Zighoud Youcef', 'Ibn Ziad', 'Beni Hamiden', 'Ouled Rahmoune', 'Ain Abid', 'Massinissa'],
  },
  {
    code: 26, name: 'Médéa', nameAr: 'المدية',
    homeFee: 800, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Médéa', 'Berrouaghia', 'Ksar El Boukhari', 'Beni Slimane', 'Tablat', 'Ouzera', 'Chellalet El Adhaoura', 'Aïn Boucif', 'Souaghi', 'El Omaria', 'Seghouane', 'Ouled Antar'],
  },
  {
    code: 27, name: 'Mostaganem', nameAr: 'مستغانم',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Mostaganem', 'Aïn Tédelès', 'Sidi Ali', 'Hassi Mameche', 'Bouguirat', 'Achaacha', 'Kheireddine', 'Mesra', 'Sidi Lakhdar', 'Mazagran', 'Fornaka', 'Sour'],
  },
  {
    code: 28, name: 'M\'Sila', nameAr: 'المسيلة',
    homeFee: 850, deskFee: 500, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['M\'Sila', 'Bou Saâda', 'Sidi Aïssa', 'Aïn El Melh', 'Magra', 'Hammam Dhalaa', 'Ouled Derradj', 'Chellal', 'Djebel Messaad', 'Berhoum', 'Khoubana', 'Medjedel'],
  },
  {
    code: 29, name: 'Mascara', nameAr: 'معسكر',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Mascara', 'Sig', 'Mohammadia', 'Tighennif', 'Bouhanifia', 'Ghriss', 'Oued El Abtal', 'Zahana', 'El Bordj', 'Aouf', 'Hachem', 'Tizi'],
  },
  {
    code: 30, name: 'Ouargla', nameAr: 'ورقلة',
    homeFee: 950, deskFee: 600, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 6],
    communes: ['Ouargla', 'Hassi Messaoud', 'N\'Goussa', 'Rouissat', 'Sidi Khouiled', 'Aïn Beida', 'El Borma', 'Hassi Ben Abdellah'],
  },
  {
    code: 31, name: 'Oran', nameAr: 'وهران',
    homeFee: 800, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Oran', 'Es Sénia', 'Bir El Djir', 'Arzew', 'Aïn El Turk', 'Bethioua', 'Gdyel', 'Oued Tlelat', 'Boutlelis', 'Misserghin', 'Mers El Kébir', 'Hassi Bounif', 'Sidi Chami', 'El Kerma', 'Aïn El Bia'],
  },
  {
    code: 32, name: 'El Bayadh', nameAr: 'البيض',
    homeFee: 1100, deskFee: 600, hasDesk: true, returnFee: 150, isServed: true, delay: [4, 6],
    communes: ['El Bayadh', 'Bougtoub', 'Rogassa', 'El Abiodh Sidi Cheikh', 'Brezina', 'Chellala', 'Boualem', 'Ghassoul', 'Stitten'],
  },
  {
    // Absente de la grille ZR Express : aucune livraison possible.
    code: 33, name: 'Illizi', nameAr: 'إليزي',
    homeFee: 0, deskFee: 0, hasDesk: false, returnFee: 0, isServed: false, delay: [0, 0],
    communes: ['Illizi', 'Djanet', 'In Amenas', 'Bordj Omar Driss'],
  },
  {
    code: 34, name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج',
    homeFee: 800, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Bordj Bou Arréridj', 'Ras El Oued', 'Mansoura', 'El Achir', 'Bordj Ghedir', 'Djaafra', 'Medjana', 'Bir Kasdali', 'El Hamadia', 'Aïn Taghrout', 'Sidi Embarek'],
  },
  {
    code: 35, name: 'Boumerdès', nameAr: 'بومرداس',
    homeFee: 700, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [1, 3],
    communes: ['Boumerdès', 'Boudouaou', 'Bordj Menaïel', 'Dellys', 'Naciria', 'Isser', 'Khemis El Khechna', 'Thenia', 'Zemmouri', 'Ouled Moussa', 'Corso', 'Baghlia', 'Réghaïa Plage', 'Si Mustapha'],
  },
  {
    code: 36, name: 'El Tarf', nameAr: 'الطارف',
    homeFee: 850, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['El Tarf', 'El Kala', 'Ben M\'Hidi', 'Bouhadjar', 'Dréan', 'Besbes', 'Chihani', 'Zitouna', 'Souarekh', 'Aïn El Assel'],
  },
  {
    // Absente de la grille ZR Express : aucune livraison possible.
    code: 37, name: 'Tindouf', nameAr: 'تندوف',
    homeFee: 0, deskFee: 0, hasDesk: false, returnFee: 0, isServed: false, delay: [0, 0],
    communes: ['Tindouf', 'Oum El Assel'],
  },
  {
    code: 38, name: 'Tissemsilt', nameAr: 'تيسمسيلت',
    homeFee: 900, deskFee: 520, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Tissemsilt', 'Théniet El Had', 'Bordj Bou Naama', 'Lardjem', 'Khemisti', 'Ammari', 'Lazharia', 'Bordj Emir Abdelkader'],
  },
  {
    code: 39, name: 'El Oued', nameAr: 'الوادي',
    homeFee: 950, deskFee: 600, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 6],
    communes: ['El Oued', 'Guemar', 'Debila', 'Reguiba', 'Hassani Abdelkrim', 'Robbah', 'Magrane', 'Bayadha', 'Taleb Larbi', 'Hassi Khalifa', 'Douar El Ma'],
  },
  {
    code: 40, name: 'Khenchela', nameAr: 'خنشلة',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Khenchela', 'Kais', 'Chechar', 'Bouhmama', 'Ouled Rechache', 'El Hamma', 'Babar', 'Ain Touila', 'Djellal', 'M\'Toussa'],
  },
  {
    code: 41, name: 'Souk Ahras', nameAr: 'سوق أهراس',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Souk Ahras', 'Sedrata', 'M\'Daourouch', 'Taoura', 'Heddada', 'Mechroha', 'Bir Bouhouche', 'Ouled Driss', 'Zaarouria', 'Khemissa'],
  },
  {
    code: 42, name: 'Tipaza', nameAr: 'تيبازة',
    homeFee: 700, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [1, 3],
    communes: ['Tipaza', 'Koléa', 'Cherchell', 'Hadjout', 'Fouka', 'Bou Ismaïl', 'Ahmer El Aïn', 'Damous', 'Gouraya', 'Sidi Amar', 'Douaouda', 'Attatba', 'Menaceur'],
  },
  {
    code: 43, name: 'Mila', nameAr: 'ميلة',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Mila', 'Ferdjioua', 'Chelghoum Laïd', 'Grarem Gouga', 'Tadjenanet', 'Oued Endja', 'Rouached', 'Teleghma', 'Sidi Merouane', 'Bouhatem', 'Terrai Bainen'],
  },
  {
    code: 44, name: 'Aïn Defla', nameAr: 'عين الدفلى',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Aïn Defla', 'Khemis Miliana', 'Miliana', 'El Attaf', 'Djelida', 'Bourached', 'Rouina', 'Hammam Righa', 'El Abadia', 'Boumedfaa', 'Djendel', 'Bordj Emir Khaled'],
  },
  {
    code: 45, name: 'Naâma', nameAr: 'النعامة',
    homeFee: 1100, deskFee: 600, hasDesk: true, returnFee: 150, isServed: true, delay: [4, 6],
    communes: ['Naâma', 'Mécheria', 'Aïn Sefra', 'Sfissifa', 'Moghrar', 'Asla', 'Tiout', 'Mekmen Ben Amar'],
  },
  {
    code: 46, name: 'Aïn Témouchent', nameAr: 'عين تموشنت',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 5],
    communes: ['Aïn Témouchent', 'Hammam Bouhadjar', 'Beni Saf', 'El Malah', 'Aïn Kihal', 'Oulhaça', 'El Amria', 'Chaabat El Ham', 'Terga', 'Sidi Ben Adda'],
  },
  {
    code: 47, name: 'Ghardaïa', nameAr: 'غرداية',
    homeFee: 950, deskFee: 550, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 6],
    communes: ['Ghardaïa', 'Metlili', 'Berriane', 'El Guerrara', 'Bounoura', 'El Atteuf', 'Daya Ben Dahoua', 'Zelfana', 'Sebseb', 'Mansoura'],
  },
  {
    code: 48, name: 'Relizane', nameAr: 'غليزان',
    homeFee: 900, deskFee: 450, hasDesk: true, returnFee: 150, isServed: true, delay: [2, 4],
    communes: ['Relizane', 'Oued Rhiou', 'Mazouna', 'Zemmoura', 'Ammi Moussa', 'Djidiouia', 'Mendes', 'Sidi M\'Hamed Ben Ali', 'El Matmar', 'Yellel', 'Sidi Khettab'],
  },
  {
    code: 49, name: 'Timimoun', nameAr: 'تيميمون',
    homeFee: 1400, deskFee: 900, hasDesk: true, returnFee: 200, isServed: true, delay: [4, 8],
    communes: ['Timimoun', 'Aougrout', 'Charouine', 'Ouled Saïd', 'Talmine', 'Tinerkouk', 'Metarfa'],
  },
  {
    // Absente de la grille ZR Express : aucune livraison possible.
    code: 50, name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار',
    homeFee: 0, deskFee: 0, hasDesk: false, returnFee: 0, isServed: false, delay: [0, 0],
    communes: ['Bordj Badji Mokhtar', 'Timiaouine'],
  },
  {
    code: 51, name: 'Ouled Djellal', nameAr: 'أولاد جلال',
    homeFee: 950, deskFee: 550, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 6],
    communes: ['Ouled Djellal', 'Sidi Khaled', 'Doucen', 'Chaiba', 'Ras El Miaad', 'Besbes'],
  },
  {
    code: 52, name: 'Béni Abbès', nameAr: 'بني عباس',
    homeFee: 1100, deskFee: 900, hasDesk: true, returnFee: 150, isServed: true, delay: [4, 8],
    communes: ['Béni Abbès', 'Igli', 'Kerzaz', 'El Ouata', 'Tamtert', 'Ouled Khodeir', 'Beni Ikhlef'],
  },
  {
    code: 53, name: 'In Salah', nameAr: 'عين صالح',
    homeFee: 1600, deskFee: 1120, hasDesk: true, returnFee: 250, isServed: true, delay: [5, 9],
    communes: ['In Salah', 'Foggaret Ezzoua', 'In Ghar'],
  },
  {
    // Stop desk à 0 DA dans la grille ZR Express → aucun bureau dans la wilaya.
    code: 54, name: 'In Guezzam', nameAr: 'عين قزام',
    homeFee: 1600, deskFee: 0, hasDesk: false, returnFee: 250, isServed: true, delay: [6, 10],
    communes: ['In Guezzam', 'Tin Zaouatine'],
  },
  {
    code: 55, name: 'Touggourt', nameAr: 'تقرت',
    homeFee: 950, deskFee: 600, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 6],
    communes: ['Touggourt', 'Témacine', 'Megarine', 'El Hadjira', 'Taibet', 'Nezla', 'Zaouia El Abidia', 'Blidet Amor'],
  },
  {
    // Absente de la grille ZR Express : aucune livraison possible.
    code: 56, name: 'Djanet', nameAr: 'جانت',
    homeFee: 0, deskFee: 0, hasDesk: false, returnFee: 0, isServed: false, delay: [0, 0],
    communes: ['Djanet', 'Bordj El Haouas'],
  },
  {
    // Stop desk à 0 DA dans la grille ZR Express → aucun bureau dans la wilaya.
    code: 57, name: 'El M\'Ghair', nameAr: 'المغير',
    homeFee: 950, deskFee: 0, hasDesk: false, returnFee: 150, isServed: true, delay: [3, 6],
    communes: ['El M\'Ghair', 'Djamaa', 'Sidi Khelil', 'Still', 'M\'Rara', 'Oum Touyour'],
  },
  {
    code: 58, name: 'El Meniaa', nameAr: 'المنيعة',
    homeFee: 1000, deskFee: 670, hasDesk: true, returnFee: 150, isServed: true, delay: [3, 6],
    communes: ['El Meniaa', 'Hassi Gara', 'Hassi Fehal'],
  },
] as const;

/** Index par code pour un accès O(1). */
const BY_CODE = new Map<number, Wilaya>(WILAYAS.map((w) => [w.code, w]));

export function getWilaya(code: number | null | undefined): Wilaya | undefined {
  if (code == null) return undefined;
  return BY_CODE.get(code);
}

/** Wilayas réellement livrables, triées par code. */
export const SERVED_WILAYAS: readonly Wilaya[] = WILAYAS.filter((w) => w.isServed);

/** Nombre de wilayas desservies — utilisé dans la barre d'annonce et le SEO. */
export const SERVED_COUNT = SERVED_WILAYAS.length;

/**
 * Tarif domicile le plus bas de la grille de référence — sert d'accroche
 * « livraison dès X DA » dans les textes de vente.
 *
 * Comme `SERVED_COUNT`, cette valeur vient du fichier et non de la base : elle
 * apparaît dans le pied de page et la barre d'annonce, présents sur toutes les
 * pages. Les lire en base rendrait chaque page dynamique et ferait perdre la
 * génération statique, pour un argument marketing qui change une fois par an.
 * Partout où un montant engage réellement la boutique — tunnel de commande,
 * création de commande, page « Livraison » — les tarifs viennent de la base.
 */
export const MIN_HOME_FEE = Math.min(...SERVED_WILAYAS.map((w) => w.homeFee));

/** Communes d'une wilaya, pour le sélecteur du formulaire de commande. */
export function getCommunes(code: number | null | undefined): readonly string[] {
  return getWilaya(code)?.communes ?? [];
}
