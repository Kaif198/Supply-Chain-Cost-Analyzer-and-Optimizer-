import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Warehouse location: Fuschl am See, Salzburg
const WAREHOUSE_DATA = {
  name: 'Red Bull Distribution Center Fuschl',
  address: 'Fuschl am See, 5330 Salzburg, Austria',
  latitude: 47.8011,
  longitude: 13.276,
  elevation: 663,
};

// Vehicle data with exact specifications from requirements
const VEHICLES_DATA = [
  {
    name: 'Small Van',
    type: 'small_van',
    capacity: 800,
    fuelConsumptionRate: 0.12,
    co2EmissionRate: 0.28,
    hourlyLaborCost: 25,
    fixedCostPerDelivery: 15,
  },
  {
    name: 'Medium Truck',
    type: 'medium_truck',
    capacity: 2400,
    fuelConsumptionRate: 0.18,
    co2EmissionRate: 0.42,
    hourlyLaborCost: 30,
    fixedCostPerDelivery: 25,
  },
  {
    name: 'Large Truck',
    type: 'large_truck',
    capacity: 6000,
    fuelConsumptionRate: 0.25,
    co2EmissionRate: 0.58,
    hourlyLaborCost: 35,
    fixedCostPerDelivery: 40,
  },
];

// Austrian premises with realistic coordinates (within 46.4°-49.0°N, 9.5°-17.2°E)
// Distributed across major Austrian cities and regions
const PREMISES_DATA = [
  // Vienna (Wien) - Nightclubs
  {
    name: 'Flex Vienna',
    category: 'nightclub',
    address: 'Donaukanal, 1010 Vienna',
    latitude: 48.2115,
    longitude: 16.3789,
    elevation: 171,
    weeklyDemand: 450,
  },
  {
    name: 'Pratersauna',
    category: 'nightclub',
    address: 'Waldsteingartenstraße 135, 1020 Vienna',
    latitude: 48.2167,
    longitude: 16.4167,
    elevation: 156,
    weeklyDemand: 380,
  },
  {
    name: 'Grelle Forelle',
    category: 'nightclub',
    address: 'Spittelauer Lände 12, 1090 Vienna',
    latitude: 48.2278,
    longitude: 16.3611,
    elevation: 165,
    weeklyDemand: 420,
  },
  {
    name: 'Club U',
    category: 'nightclub',
    address: 'Karlsplatz 13, 1010 Vienna',
    latitude: 48.2005,
    longitude: 16.3719,
    elevation: 175,
    weeklyDemand: 390,
  },
  // Vienna - Gyms
  {
    name: 'FitInn Vienna Center',
    category: 'gym',
    address: 'Mariahilfer Straße 77-79, 1060 Vienna',
    latitude: 48.1989,
    longitude: 16.3456,
    elevation: 180,
    weeklyDemand: 280,
  },
  {
    name: 'John Harris Fitness Vienna',
    category: 'gym',
    address: 'Kärntner Ring 5-7, 1010 Vienna',
    latitude: 48.2025,
    longitude: 16.3711,
    elevation: 172,
    weeklyDemand: 320,
  },
  {
    name: 'Clever Fit Vienna',
    category: 'gym',
    address: 'Landstraßer Hauptstraße 1, 1030 Vienna',
    latitude: 48.2056,
    longitude: 16.3833,
    elevation: 168,
    weeklyDemand: 250,
  },
  // Vienna - Retail
  {
    name: 'Spar Supermarket Stephansplatz',
    category: 'retail',
    address: 'Stephansplatz 3, 1010 Vienna',
    latitude: 48.2083,
    longitude: 16.3731,
    elevation: 171,
    weeklyDemand: 520,
  },
  {
    name: 'Billa Plus Mariahilf',
    category: 'retail',
    address: 'Mariahilfer Straße 45, 1060 Vienna',
    latitude: 48.1978,
    longitude: 16.3489,
    elevation: 182,
    weeklyDemand: 480,
  },
  {
    name: 'Hofer Vienna Favoriten',
    category: 'retail',
    address: 'Favoritenstraße 123, 1100 Vienna',
    latitude: 48.1722,
    longitude: 16.3778,
    elevation: 185,
    weeklyDemand: 550,
  },
  // Vienna - Restaurants
  {
    name: 'Plachutta Wollzeile',
    category: 'restaurant',
    address: 'Wollzeile 38, 1010 Vienna',
    latitude: 48.2089,
    longitude: 16.3778,
    elevation: 170,
    weeklyDemand: 180,
  },
  {
    name: 'Figlmüller',
    category: 'restaurant',
    address: 'Bäckerstraße 6, 1010 Vienna',
    latitude: 48.2094,
    longitude: 16.3756,
    elevation: 169,
    weeklyDemand: 200,
  },
  {
    name: 'Café Central',
    category: 'restaurant',
    address: 'Herrengasse 14, 1010 Vienna',
    latitude: 48.2106,
    longitude: 16.3656,
    elevation: 173,
    weeklyDemand: 220,
  },
  // Vienna - Hotels
  {
    name: 'Hotel Sacher Wien',
    category: 'hotel',
    address: 'Philharmoniker Straße 4, 1010 Vienna',
    latitude: 48.2039,
    longitude: 16.3694,
    elevation: 174,
    weeklyDemand: 350,
  },
  {
    name: 'Grand Hotel Wien',
    category: 'hotel',
    address: 'Kärntner Ring 9, 1010 Vienna',
    latitude: 48.2017,
    longitude: 16.3722,
    elevation: 172,
    weeklyDemand: 380,
  },
  {
    name: 'Hotel Imperial Vienna',
    category: 'hotel',
    address: 'Kärntner Ring 16, 1015 Vienna',
    latitude: 48.2011,
    longitude: 16.3739,
    elevation: 171,
    weeklyDemand: 400,
  },
  // Salzburg - Nightclubs
  {
    name: 'Republic Café Salzburg',
    category: 'nightclub',
    address: 'Anton-Neumayr-Platz 2, 5020 Salzburg',
    latitude: 47.8028,
    longitude: 13.0444,
    elevation: 424,
    weeklyDemand: 320,
  },
  {
    name: 'Jazzit Salzburg',
    category: 'nightclub',
    address: 'Elisabethstraße 11, 5020 Salzburg',
    latitude: 47.8056,
    longitude: 13.0472,
    elevation: 428,
    weeklyDemand: 280,
  },
  // Salzburg - Gyms
  {
    name: 'FitInn Salzburg',
    category: 'gym',
    address: 'Alpenstraße 107, 5020 Salzburg',
    latitude: 47.8111,
    longitude: 13.0389,
    elevation: 435,
    weeklyDemand: 240,
  },
  {
    name: 'Clever Fit Salzburg',
    category: 'gym',
    address: 'Münchner Bundesstraße 114, 5020 Salzburg',
    latitude: 47.7944,
    longitude: 13.0278,
    elevation: 430,
    weeklyDemand: 220,
  },
  // Salzburg - Retail
  {
    name: 'Spar Salzburg Altstadt',
    category: 'retail',
    address: 'Getreidegasse 24, 5020 Salzburg',
    latitude: 47.7989,
    longitude: 13.0444,
    elevation: 424,
    weeklyDemand: 460,
  },
  {
    name: 'Billa Salzburg Mirabell',
    category: 'retail',
    address: 'Mirabellplatz 5, 5020 Salzburg',
    latitude: 47.8056,
    longitude: 13.0417,
    elevation: 426,
    weeklyDemand: 420,
  },
  // Salzburg - Restaurants
  {
    name: 'St. Peter Stiftskulinarium',
    category: 'restaurant',
    address: 'St.-Peter-Bezirk 1/4, 5020 Salzburg',
    latitude: 47.7972,
    longitude: 13.0444,
    elevation: 425,
    weeklyDemand: 190,
  },
  {
    name: 'Goldener Hirsch',
    category: 'restaurant',
    address: 'Getreidegasse 37, 5020 Salzburg',
    latitude: 47.7983,
    longitude: 13.0456,
    elevation: 424,
    weeklyDemand: 210,
  },
  // Salzburg - Hotels
  {
    name: 'Hotel Sacher Salzburg',
    category: 'hotel',
    address: 'Schwarzstraße 5-7, 5020 Salzburg',
    latitude: 47.8,
    longitude: 13.0444,
    elevation: 424,
    weeklyDemand: 340,
  },
  {
    name: 'Hotel Goldener Hirsch',
    category: 'hotel',
    address: 'Getreidegasse 37, 5020 Salzburg',
    latitude: 47.7983,
    longitude: 13.0456,
    elevation: 424,
    weeklyDemand: 360,
  },
  // Innsbruck - Nightclubs
  {
    name: 'Treibhaus Innsbruck',
    category: 'nightclub',
    address: 'Angerzellgasse 8, 6020 Innsbruck',
    latitude: 47.2656,
    longitude: 11.3933,
    elevation: 574,
    weeklyDemand: 300,
  },
  {
    name: 'Club Filou Innsbruck',
    category: 'nightclub',
    address: 'Sterzinger Straße 3, 6020 Innsbruck',
    latitude: 47.2689,
    longitude: 11.3944,
    elevation: 580,
    weeklyDemand: 270,
  },
  // Innsbruck - Gyms
  {
    name: 'FitInn Innsbruck',
    category: 'gym',
    address: 'Museumstraße 38, 6020 Innsbruck',
    latitude: 47.2667,
    longitude: 11.3917,
    elevation: 575,
    weeklyDemand: 230,
  },
  {
    name: 'John Harris Fitness Innsbruck',
    category: 'gym',
    address: 'Maria-Theresien-Straße 18, 6020 Innsbruck',
    latitude: 47.2683,
    longitude: 11.3944,
    elevation: 578,
    weeklyDemand: 260,
  },
  // Innsbruck - Retail
  {
    name: 'Spar Innsbruck Maria-Theresien',
    category: 'retail',
    address: 'Maria-Theresien-Straße 31, 6020 Innsbruck',
    latitude: 47.2694,
    longitude: 11.3956,
    elevation: 580,
    weeklyDemand: 440,
  },
  {
    name: 'Billa Innsbruck Altstadt',
    category: 'retail',
    address: 'Herzog-Friedrich-Straße 23, 6020 Innsbruck',
    latitude: 47.2678,
    longitude: 11.3933,
    elevation: 576,
    weeklyDemand: 410,
  },
  // Innsbruck - Restaurants
  {
    name: 'Lichtblick Innsbruck',
    category: 'restaurant',
    address: 'Maria-Theresien-Straße 18, 6020 Innsbruck',
    latitude: 47.2683,
    longitude: 11.3944,
    elevation: 578,
    weeklyDemand: 170,
  },
  {
    name: 'Die Wilderin',
    category: 'restaurant',
    address: 'Seilergasse 5, 6020 Innsbruck',
    latitude: 47.2672,
    longitude: 11.3928,
    elevation: 575,
    weeklyDemand: 160,
  },
  // Innsbruck - Hotels
  {
    name: 'Grand Hotel Europa Innsbruck',
    category: 'hotel',
    address: 'Südtiroler Platz 2, 6020 Innsbruck',
    latitude: 47.2644,
    longitude: 11.4,
    elevation: 582,
    weeklyDemand: 330,
  },
  {
    name: 'Hotel Innsbruck',
    category: 'hotel',
    address: 'Innrain 3, 6020 Innsbruck',
    latitude: 47.2667,
    longitude: 11.3944,
    elevation: 577,
    weeklyDemand: 310,
  },
  // Graz - Nightclubs
  {
    name: 'Postgarage Graz',
    category: 'nightclub',
    address: 'Dreihackengasse 42, 8020 Graz',
    latitude: 47.0722,
    longitude: 15.4333,
    elevation: 353,
    weeklyDemand: 340,
  },
  {
    name: 'P.P.C. Graz',
    category: 'nightclub',
    address: 'Prokopigasse 16, 8010 Graz',
    latitude: 47.0711,
    longitude: 15.4389,
    elevation: 355,
    weeklyDemand: 310,
  },
  // Graz - Gyms
  {
    name: 'FitInn Graz',
    category: 'gym',
    address: 'Annenstraße 29, 8020 Graz',
    latitude: 47.0667,
    longitude: 15.4333,
    elevation: 350,
    weeklyDemand: 250,
  },
  {
    name: 'Clever Fit Graz',
    category: 'gym',
    address: 'Herrengasse 13, 8010 Graz',
    latitude: 47.0711,
    longitude: 15.4389,
    elevation: 354,
    weeklyDemand: 230,
  },
  // Graz - Retail
  {
    name: 'Spar Graz Hauptplatz',
    category: 'retail',
    address: 'Hauptplatz 11, 8010 Graz',
    latitude: 47.0708,
    longitude: 15.4383,
    elevation: 353,
    weeklyDemand: 470,
  },
  {
    name: 'Billa Graz Annenstraße',
    category: 'retail',
    address: 'Annenstraße 45, 8020 Graz',
    latitude: 47.0656,
    longitude: 15.4344,
    elevation: 349,
    weeklyDemand: 430,
  },
  // Graz - Restaurants
  {
    name: 'Aiola Upstairs',
    category: 'restaurant',
    address: 'Schloßbergplatz 1, 8010 Graz',
    latitude: 47.0756,
    longitude: 15.4378,
    elevation: 473,
    weeklyDemand: 180,
  },
  {
    name: 'Der Steirer',
    category: 'restaurant',
    address: 'Belgiergasse 1, 8020 Graz',
    latitude: 47.0722,
    longitude: 15.4311,
    elevation: 352,
    weeklyDemand: 190,
  },
  // Graz - Hotels
  {
    name: 'Hotel Wiesler Graz',
    category: 'hotel',
    address: 'Grieskai 4-8, 8020 Graz',
    latitude: 47.0722,
    longitude: 15.4333,
    elevation: 353,
    weeklyDemand: 320,
  },
  {
    name: 'Grand Hotel Wiesler',
    category: 'hotel',
    address: 'Grieskai 4-8, 8020 Graz',
    latitude: 47.0722,
    longitude: 15.4333,
    elevation: 353,
    weeklyDemand: 350,
  },
  // Linz - Nightclubs
  {
    name: 'Stadtwerkstatt Linz',
    category: 'nightclub',
    address: 'Kirchengasse 4, 4040 Linz',
    latitude: 48.3069,
    longitude: 14.2858,
    elevation: 266,
    weeklyDemand: 290,
  },
  {
    name: 'Kulturverein Kapu',
    category: 'nightclub',
    address: 'Kapuzinerstraße 36, 4020 Linz',
    latitude: 48.3,
    longitude: 14.2833,
    elevation: 264,
    weeklyDemand: 260,
  },
  // Linz - Gyms
  {
    name: 'FitInn Linz',
    category: 'gym',
    address: 'Landstraße 49, 4020 Linz',
    latitude: 48.3056,
    longitude: 14.2861,
    elevation: 265,
    weeklyDemand: 240,
  },
  {
    name: 'John Harris Fitness Linz',
    category: 'gym',
    address: 'Hauptplatz 1, 4020 Linz',
    latitude: 48.3069,
    longitude: 14.2858,
    elevation: 266,
    weeklyDemand: 270,
  },
  // Linz - Retail
  {
    name: 'Spar Linz Hauptplatz',
    category: 'retail',
    address: 'Hauptplatz 18, 4020 Linz',
    latitude: 48.3069,
    longitude: 14.2858,
    elevation: 266,
    weeklyDemand: 450,
  },
  {
    name: 'Billa Linz Landstraße',
    category: 'retail',
    address: 'Landstraße 67, 4020 Linz',
    latitude: 48.3056,
    longitude: 14.2889,
    elevation: 267,
    weeklyDemand: 420,
  },
  // Linz - Restaurants
  {
    name: 'Herberstein Linz',
    category: 'restaurant',
    address: 'Altstadt 10, 4020 Linz',
    latitude: 48.3069,
    longitude: 14.2844,
    elevation: 265,
    weeklyDemand: 175,
  },
  {
    name: 'Cubus Restaurant',
    category: 'restaurant',
    address: 'Ars Electronica Center, 4040 Linz',
    latitude: 48.3097,
    longitude: 14.2847,
    elevation: 264,
    weeklyDemand: 165,
  },
  // Linz - Hotels
  {
    name: 'Austria Trend Hotel Schillerpark',
    category: 'hotel',
    address: 'Rainerstraße 2-4, 4020 Linz',
    latitude: 48.3056,
    longitude: 14.2833,
    elevation: 264,
    weeklyDemand: 300,
  },
  {
    name: 'Hotel Schwarzer Bär',
    category: 'hotel',
    address: 'Herrenstraße 9-11, 4020 Linz',
    latitude: 48.3069,
    longitude: 14.2858,
    elevation: 266,
    weeklyDemand: 290,
  },
  // Klagenfurt - Nightclubs
  {
    name: 'Raj Klagenfurt',
    category: 'nightclub',
    address: 'Pfarrplatz 20, 9020 Klagenfurt',
    latitude: 46.6244,
    longitude: 14.3078,
    elevation: 446,
    weeklyDemand: 270,
  },
  {
    name: 'Club Privilege',
    category: 'nightclub',
    address: 'Völkermarkter Ring 21, 9020 Klagenfurt',
    latitude: 46.6167,
    longitude: 14.3,
    elevation: 445,
    weeklyDemand: 240,
  },
  // Klagenfurt - Gyms
  {
    name: 'FitInn Klagenfurt',
    category: 'gym',
    address: 'Bahnhofstraße 44, 9020 Klagenfurt',
    latitude: 46.6244,
    longitude: 14.3111,
    elevation: 447,
    weeklyDemand: 220,
  },
  {
    name: 'Clever Fit Klagenfurt',
    category: 'gym',
    address: 'Alter Platz 30, 9020 Klagenfurt',
    latitude: 46.6244,
    longitude: 14.3078,
    elevation: 446,
    weeklyDemand: 200,
  },
  // Klagenfurt - Retail
  {
    name: 'Spar Klagenfurt Altstadt',
    category: 'retail',
    address: 'Alter Platz 14, 9020 Klagenfurt',
    latitude: 46.6244,
    longitude: 14.3078,
    elevation: 446,
    weeklyDemand: 430,
  },
  {
    name: 'Billa Klagenfurt Bahnhof',
    category: 'retail',
    address: 'Bahnhofstraße 33, 9020 Klagenfurt',
    latitude: 46.6244,
    longitude: 14.3111,
    elevation: 447,
    weeklyDemand: 400,
  },
  // Klagenfurt - Restaurants
  {
    name: 'Pumpe Klagenfurt',
    category: 'restaurant',
    address: 'Lidmanskygasse 2, 9020 Klagenfurt',
    latitude: 46.6244,
    longitude: 14.3056,
    elevation: 445,
    weeklyDemand: 160,
  },
  {
    name: 'Maria Loretto',
    category: 'restaurant',
    address: 'Lorettoweg 54, 9020 Klagenfurt',
    latitude: 46.6111,
    longitude: 14.2944,
    elevation: 450,
    weeklyDemand: 150,
  },
  // Klagenfurt - Hotels
  {
    name: 'Hotel Sandwirth',
    category: 'hotel',
    address: 'Pernhartgasse 9, 9020 Klagenfurt',
    latitude: 46.6244,
    longitude: 14.3089,
    elevation: 446,
    weeklyDemand: 280,
  },
  {
    name: 'Seepark Hotel',
    category: 'hotel',
    address: 'Universitätsstraße 104, 9020 Klagenfurt',
    latitude: 46.6167,
    longitude: 14.2667,
    elevation: 448,
    weeklyDemand: 270,
  },
  // Bregenz - Nightclubs
  {
    name: 'Wirtshaus am See',
    category: 'nightclub',
    address: 'Seepromenade 2, 6900 Bregenz',
    latitude: 47.5056,
    longitude: 9.7472,
    elevation: 398,
    weeklyDemand: 250,
  },
  {
    name: 'Club Cube Bregenz',
    category: 'nightclub',
    address: 'Rathausstraße 4, 6900 Bregenz',
    latitude: 47.5056,
    longitude: 9.7472,
    elevation: 398,
    weeklyDemand: 230,
  },
  // Bregenz - Gyms
  {
    name: 'FitInn Bregenz',
    category: 'gym',
    address: 'Römerstraße 15, 6900 Bregenz',
    latitude: 47.5056,
    longitude: 9.7444,
    elevation: 397,
    weeklyDemand: 210,
  },
  {
    name: 'Clever Fit Bregenz',
    category: 'gym',
    address: 'Bahnhofstraße 35, 6900 Bregenz',
    latitude: 47.5028,
    longitude: 9.7472,
    elevation: 398,
    weeklyDemand: 190,
  },
  // Bregenz - Retail
  {
    name: 'Spar Bregenz Innenstadt',
    category: 'retail',
    address: 'Kaiserstraße 9, 6900 Bregenz',
    latitude: 47.5056,
    longitude: 9.7472,
    elevation: 398,
    weeklyDemand: 410,
  },
  {
    name: 'Billa Bregenz Bahnhof',
    category: 'retail',
    address: 'Bahnhofstraße 14, 6900 Bregenz',
    latitude: 47.5028,
    longitude: 9.7472,
    elevation: 398,
    weeklyDemand: 380,
  },
  // Bregenz - Restaurants
  {
    name: 'Goldener Hirschen',
    category: 'restaurant',
    address: 'Kirchstraße 8, 6900 Bregenz',
    latitude: 47.5056,
    longitude: 9.7456,
    elevation: 397,
    weeklyDemand: 155,
  },
  {
    name: 'Mangold Bregenz',
    category: 'restaurant',
    address: 'Seestraße 4, 6900 Bregenz',
    latitude: 47.5056,
    longitude: 9.7472,
    elevation: 398,
    weeklyDemand: 145,
  },
  // Bregenz - Hotels
  {
    name: 'Hotel Schwärzler',
    category: 'hotel',
    address: 'Landstraße 9, 6900 Bregenz',
    latitude: 47.5056,
    longitude: 9.7472,
    elevation: 398,
    weeklyDemand: 260,
  },
  {
    name: 'Messmer Hotel',
    category: 'hotel',
    address: 'Kornmarktstraße 16, 6900 Bregenz',
    latitude: 47.5056,
    longitude: 9.7456,
    elevation: 397,
    weeklyDemand: 250,
  },
  // St. Pölten - Nightclubs
  {
    name: 'Warehouse St. Pölten',
    category: 'nightclub',
    address: 'Mühlweg 67, 3100 St. Pölten',
    latitude: 48.2,
    longitude: 15.6333,
    elevation: 267,
    weeklyDemand: 260,
  },
  // St. Pölten - Gyms
  {
    name: 'FitInn St. Pölten',
    category: 'gym',
    address: 'Kremser Gasse 25, 3100 St. Pölten',
    latitude: 48.2056,
    longitude: 15.6278,
    elevation: 268,
    weeklyDemand: 210,
  },
  {
    name: 'Clever Fit St. Pölten',
    category: 'gym',
    address: 'Rathausplatz 1, 3100 St. Pölten',
    latitude: 48.2056,
    longitude: 15.6278,
    elevation: 268,
    weeklyDemand: 200,
  },
  // St. Pölten - Retail
  {
    name: 'Spar St. Pölten Zentrum',
    category: 'retail',
    address: 'Rathausplatz 5, 3100 St. Pölten',
    latitude: 48.2056,
    longitude: 15.6278,
    elevation: 268,
    weeklyDemand: 420,
  },
  {
    name: 'Billa St. Pölten',
    category: 'retail',
    address: 'Kremser Gasse 30, 3100 St. Pölten',
    latitude: 48.2056,
    longitude: 15.6278,
    elevation: 268,
    weeklyDemand: 390,
  },
  // St. Pölten - Restaurants
  {
    name: 'Zum Gmoana Hund',
    category: 'restaurant',
    address: 'Rathausplatz 9, 3100 St. Pölten',
    latitude: 48.2056,
    longitude: 15.6278,
    elevation: 268,
    weeklyDemand: 150,
  },
  // St. Pölten - Hotels
  {
    name: 'Austria Trend Hotel Metropol',
    category: 'hotel',
    address: 'Schillerplatz 1, 3100 St. Pölten',
    latitude: 48.2056,
    longitude: 15.6278,
    elevation: 268,
    weeklyDemand: 270,
  },
  // Villach - Nightclubs
  {
    name: 'Club Tanzstadl',
    category: 'nightclub',
    address: 'Ossiacher Zeile 89, 9500 Villach',
    latitude: 46.6111,
    longitude: 13.8556,
    elevation: 501,
    weeklyDemand: 240,
  },
  // Villach - Gyms
  {
    name: 'FitInn Villach',
    category: 'gym',
    address: 'Bahnhofstraße 3, 9500 Villach',
    latitude: 46.6167,
    longitude: 13.8556,
    elevation: 501,
    weeklyDemand: 200,
  },
  // Villach - Retail
  {
    name: 'Spar Villach Hauptplatz',
    category: 'retail',
    address: 'Hauptplatz 26, 9500 Villach',
    latitude: 46.6167,
    longitude: 13.8556,
    elevation: 501,
    weeklyDemand: 400,
  },
  {
    name: 'Billa Villach',
    category: 'retail',
    address: 'Bahnhofstraße 10, 9500 Villach',
    latitude: 46.6167,
    longitude: 13.8556,
    elevation: 501,
    weeklyDemand: 370,
  },
  // Villach - Restaurants
  {
    name: 'Kärntnerstube',
    category: 'restaurant',
    address: 'Hauptplatz 3, 9500 Villach',
    latitude: 46.6167,
    longitude: 13.8556,
    elevation: 501,
    weeklyDemand: 145,
  },
  // Villach - Hotels
  {
    name: 'Hotel Palais26',
    category: 'hotel',
    address: 'Hauptplatz 26, 9500 Villach',
    latitude: 46.6167,
    longitude: 13.8556,
    elevation: 501,
    weeklyDemand: 260,
  },
  // Wels - Nightclubs
  {
    name: 'Alter Schl8hof',
    category: 'nightclub',
    address: 'Dragonerstraße 22, 4600 Wels',
    latitude: 48.1667,
    longitude: 14.0333,
    elevation: 317,
    weeklyDemand: 230,
  },
  // Wels - Gyms
  {
    name: 'FitInn Wels',
    category: 'gym',
    address: 'Kaiser-Josef-Platz 22, 4600 Wels',
    latitude: 48.1667,
    longitude: 14.0333,
    elevation: 317,
    weeklyDemand: 190,
  },
  // Wels - Retail
  {
    name: 'Spar Wels Stadtplatz',
    category: 'retail',
    address: 'Stadtplatz 44, 4600 Wels',
    latitude: 48.1667,
    longitude: 14.0333,
    elevation: 317,
    weeklyDemand: 390,
  },
  {
    name: 'Billa Wels',
    category: 'retail',
    address: 'Kaiser-Josef-Platz 30, 4600 Wels',
    latitude: 48.1667,
    longitude: 14.0333,
    elevation: 317,
    weeklyDemand: 360,
  },
  // Wels - Restaurants
  {
    name: 'Stadtbräu Wels',
    category: 'restaurant',
    address: 'Stadtplatz 55, 4600 Wels',
    latitude: 48.1667,
    longitude: 14.0333,
    elevation: 317,
    weeklyDemand: 140,
  },
  // Wels - Hotels
  {
    name: 'Hotel Ploberger',
    category: 'hotel',
    address: 'Ringstraße 1, 4600 Wels',
    latitude: 48.1667,
    longitude: 14.0333,
    elevation: 317,
    weeklyDemand: 250,
  },
  // Baden - Hotels & Restaurants
  {
    name: 'Grand Hotel Sauerhof',
    category: 'hotel',
    address: 'Weilburgstraße 11-13, 2500 Baden',
    latitude: 48.0056,
    longitude: 16.2333,
    elevation: 230,
    weeklyDemand: 280,
  },
  {
    name: 'Thermalstrandbad Restaurant',
    category: 'restaurant',
    address: 'Helenenstraße 19-21, 2500 Baden',
    latitude: 48.0056,
    longitude: 16.2333,
    elevation: 230,
    weeklyDemand: 155,
  },
  // Eisenstadt - Various
  {
    name: 'Haydnkeller',
    category: 'restaurant',
    address: 'Haydngasse 21, 7000 Eisenstadt',
    latitude: 47.8467,
    longitude: 16.5278,
    elevation: 182,
    weeklyDemand: 135,
  },
  {
    name: 'Hotel Burgenland',
    category: 'hotel',
    address: 'Franz Schubert-Platz 1, 7000 Eisenstadt',
    latitude: 47.8467,
    longitude: 16.5278,
    elevation: 182,
    weeklyDemand: 240,
  },
  // Dornbirn - Various
  {
    name: 'Spielboden Dornbirn',
    category: 'nightclub',
    address: 'Färbergasse 15, 6850 Dornbirn',
    latitude: 47.4139,
    longitude: 9.7417,
    elevation: 437,
    weeklyDemand: 220,
  },
  {
    name: 'FitInn Dornbirn',
    category: 'gym',
    address: 'Bahnhofstraße 11, 6850 Dornbirn',
    latitude: 47.4139,
    longitude: 9.7417,
    elevation: 437,
    weeklyDemand: 180,
  },
  {
    name: 'Spar Dornbirn',
    category: 'retail',
    address: 'Marktplatz 10, 6850 Dornbirn',
    latitude: 47.4139,
    longitude: 9.7417,
    elevation: 437,
    weeklyDemand: 370,
  },
  // Wiener Neustadt - Various
  {
    name: 'FitInn Wiener Neustadt',
    category: 'gym',
    address: 'Hauptplatz 1, 2700 Wiener Neustadt',
    latitude: 47.8167,
    longitude: 16.2444,
    elevation: 265,
    weeklyDemand: 200,
  },
  {
    name: 'Spar Wiener Neustadt',
    category: 'retail',
    address: 'Hauptplatz 15, 2700 Wiener Neustadt',
    latitude: 47.8167,
    longitude: 16.2444,
    elevation: 265,
    weeklyDemand: 380,
  },
  {
    name: 'Hotel Corvinus',
    category: 'hotel',
    address: 'Bahngasse 29-33, 2700 Wiener Neustadt',
    latitude: 47.8167,
    longitude: 16.2444,
    elevation: 265,
    weeklyDemand: 230,
  },
  // Steyr - Various
  {
    name: 'Röda Steyr',
    category: 'nightclub',
    address: 'Stelzhamerstraße 14, 4400 Steyr',
    latitude: 48.0389,
    longitude: 14.4211,
    elevation: 310,
    weeklyDemand: 210,
  },
  {
    name: 'Spar Steyr Stadtplatz',
    category: 'retail',
    address: 'Stadtplatz 27, 4400 Steyr',
    latitude: 48.0389,
    longitude: 14.4211,
    elevation: 310,
    weeklyDemand: 360,
  },
  {
    name: 'Hotel Mader',
    category: 'hotel',
    address: 'Stadtplatz 36, 4400 Steyr',
    latitude: 48.0389,
    longitude: 14.4211,
    elevation: 310,
    weeklyDemand: 220,
  },
];

// Validation function for Austrian boundaries
function isWithinAustrianBoundaries(lat: number, lon: number): boolean {
  return lat >= 46.4 && lat <= 49.0 && lon >= 9.5 && lon <= 17.2;
}

// Validation function for coordinates
function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.premise.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  console.log('Existing data cleared.');

  // Validate and seed warehouse
  console.log('Seeding warehouse...');
  if (
    !isValidCoordinate(WAREHOUSE_DATA.latitude, WAREHOUSE_DATA.longitude) ||
    !isWithinAustrianBoundaries(WAREHOUSE_DATA.latitude, WAREHOUSE_DATA.longitude)
  ) {
    throw new Error('Warehouse coordinates are invalid or outside Austrian boundaries');
  }

  const warehouse = await prisma.warehouse.create({
    data: WAREHOUSE_DATA,
  });
  console.log(`Warehouse created: ${warehouse.name}`);

  // Create a Premise record for the warehouse so it can be referenced as delivery origin
  // (Delivery.originId is a FK to premises, not warehouses)
  const warehousePremise = await prisma.premise.create({
    data: {
      name: warehouse.name,
      category: 'retail', // placeholder category for warehouse
      address: warehouse.address,
      latitude: warehouse.latitude,
      longitude: warehouse.longitude,
      elevation: warehouse.elevation,
      weeklyDemand: 0,
    },
  });
  console.log(`Warehouse premise created for delivery origin reference.`);

  // Seed vehicles
  console.log('Seeding vehicles...');
  const vehicles = await Promise.all(
    VEHICLES_DATA.map((vehicle) => prisma.vehicle.create({ data: vehicle }))
  );
  console.log(`${vehicles.length} vehicles created.`);

  // Validate and seed premises
  console.log('Seeding premises...');
  let validPremises = 0;
  let invalidPremises = 0;

  for (const premiseData of PREMISES_DATA) {
    // Validate coordinates
    if (!isValidCoordinate(premiseData.latitude, premiseData.longitude)) {
      console.warn(`Invalid coordinates for ${premiseData.name}: (${premiseData.latitude}, ${premiseData.longitude})`);
      invalidPremises++;
      continue;
    }

    if (!isWithinAustrianBoundaries(premiseData.latitude, premiseData.longitude)) {
      console.warn(
        `Coordinates outside Austrian boundaries for ${premiseData.name}: (${premiseData.latitude}, ${premiseData.longitude})`
      );
      invalidPremises++;
      continue;
    }

    // Validate weekly demand
    if (premiseData.weeklyDemand <= 0 || !Number.isInteger(premiseData.weeklyDemand)) {
      console.warn(`Invalid weekly demand for ${premiseData.name}: ${premiseData.weeklyDemand}`);
      invalidPremises++;
      continue;
    }

    await prisma.premise.create({ data: premiseData });
    validPremises++;
  }

  console.log(`${validPremises} premises created, ${invalidPremises} invalid premises skipped.`);

  // Seed default user
  console.log('Seeding default user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@redbull.com',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('Default user created (username: admin, password: admin123)');

  // Seed historical deliveries (90 days)
  console.log('Seeding historical deliveries...');
  const premises = await prisma.premise.findMany({ where: { weeklyDemand: { gt: 0 } } });
  const allVehicles = await prisma.vehicle.findMany();

  if (premises.length === 0 || allVehicles.length === 0) {
    console.warn('No premises or vehicles found. Skipping delivery seeding.');
  } else {
    const deliveryCount = await seedHistoricalDeliveries(
      premises,
      allVehicles,
      warehousePremise,
      90
    );
    console.log(`${deliveryCount} historical deliveries created.`);
  }

  console.log('Database seeding completed successfully!');
}

/**
 * Seed historical deliveries with realistic distributions
 * 
 * @param premises - All available premises
 * @param vehicles - All available vehicles
 * @param warehouse - The warehouse location
 * @param days - Number of days of historical data to generate
 * @returns Number of deliveries created
 */
async function seedHistoricalDeliveries(
  premises: any[],
  vehicles: any[],
  warehouse: any,
  days: number
): Promise<number> {
  const deliveries: any[] = [];
  const today = new Date();

  // Helper function to calculate distance using Haversine formula with road factor
  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const haversineDistance = R * c;

    // Apply 20% road factor
    return haversineDistance * 1.2;
  }

  // Helper function to check if route is alpine
  function isAlpineRoute(elevation1: number, elevation2: number): boolean {
    return elevation1 > 800 && elevation2 > 800;
  }

  // Helper function to calculate delivery cost
  function calculateDeliveryCost(
    distance: number,
    vehicle: any,
    isAlpine: boolean
  ): {
    fuelCost: number;
    laborCost: number;
    vehicleCost: number;
    carbonCost: number;
    totalCost: number;
    duration: number;
    co2Emissions: number;
    hasOvertime: boolean;
  } {
    const FUEL_PRICE_PER_LITER = 1.45;
    const CARBON_OFFSET_PER_TON = 25;
    const AVERAGE_SPEED_KMH = 60;
    const ALPINE_FUEL_MULTIPLIER = 1.15;
    const OVERTIME_THRESHOLD_HOURS = 8;
    const OVERTIME_MULTIPLIER = 1.5;

    // Calculate duration
    const duration = distance / AVERAGE_SPEED_KMH;

    // Calculate fuel cost
    let fuelConsumption = vehicle.fuelConsumptionRate * distance;
    if (isAlpine) {
      fuelConsumption *= ALPINE_FUEL_MULTIPLIER;
    }
    const fuelCost = fuelConsumption * FUEL_PRICE_PER_LITER;

    // Calculate labor cost
    let laborCost: number;
    if (duration <= OVERTIME_THRESHOLD_HOURS) {
      laborCost = duration * vehicle.hourlyLaborCost;
    } else {
      const baseHours = OVERTIME_THRESHOLD_HOURS;
      const overtimeHours = duration - baseHours;
      laborCost =
        baseHours * vehicle.hourlyLaborCost +
        overtimeHours * vehicle.hourlyLaborCost * OVERTIME_MULTIPLIER;
    }

    // Calculate vehicle cost
    const vehicleCost = vehicle.fixedCostPerDelivery;

    // Calculate CO2 and carbon cost
    const co2Emissions = vehicle.co2EmissionRate * distance;
    const co2Tons = co2Emissions / 1000;
    const carbonCost = co2Tons * CARBON_OFFSET_PER_TON;

    // Calculate total cost
    const totalCost = fuelCost + laborCost + vehicleCost + carbonCost;

    return {
      fuelCost,
      laborCost,
      vehicleCost,
      carbonCost,
      totalCost,
      duration,
      co2Emissions,
      hasOvertime: duration > OVERTIME_THRESHOLD_HOURS,
    };
  }

  // Generate deliveries for each day
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() - dayOffset);
    deliveryDate.setHours(8, 0, 0, 0); // Set to 8 AM

    // Determine number of deliveries for this day (3-8 deliveries per day)
    const deliveriesPerDay = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < deliveriesPerDay; i++) {
      // Select random premise (weighted by category)
      // Retail and hotels have higher delivery frequency
      const categoryWeights = {
        retail: 0.35,
        hotel: 0.25,
        nightclub: 0.2,
        restaurant: 0.15,
        gym: 0.05,
      };

      const rand = Math.random();
      let selectedCategory: string;
      let cumulative = 0;

      if (rand < (cumulative += categoryWeights.retail)) {
        selectedCategory = 'retail';
      } else if (rand < (cumulative += categoryWeights.hotel)) {
        selectedCategory = 'hotel';
      } else if (rand < (cumulative += categoryWeights.nightclub)) {
        selectedCategory = 'nightclub';
      } else if (rand < (cumulative += categoryWeights.restaurant)) {
        selectedCategory = 'restaurant';
      } else {
        selectedCategory = 'gym';
      }

      const categoryPremises = premises.filter((p) => p.category === selectedCategory);
      if (categoryPremises.length === 0) continue;

      const premise = categoryPremises[Math.floor(Math.random() * categoryPremises.length)];

      // Select vehicle based on demand
      // Use premise's weekly demand to estimate delivery size
      const deliveryDemand = Math.floor(premise.weeklyDemand * (0.3 + Math.random() * 0.4));

      let selectedVehicle: any;
      if (deliveryDemand <= 800) {
        selectedVehicle = vehicles.find((v) => v.type === 'small_van');
      } else if (deliveryDemand <= 2400) {
        selectedVehicle = vehicles.find((v) => v.type === 'medium_truck');
      } else {
        selectedVehicle = vehicles.find((v) => v.type === 'large_truck');
      }

      if (!selectedVehicle) {
        selectedVehicle = vehicles[0]; // Fallback to first vehicle
      }

      // Calculate distance
      const distance = calculateDistance(
        warehouse.latitude,
        warehouse.longitude,
        premise.latitude,
        premise.longitude
      );

      // Check if alpine route
      const isAlpine = isAlpineRoute(warehouse.elevation, premise.elevation);

      // Calculate costs
      const costs = calculateDeliveryCost(distance, selectedVehicle, isAlpine);

      // Add some time variation to delivery date
      const deliveryDateTime = new Date(deliveryDate);
      deliveryDateTime.setHours(8 + Math.floor(Math.random() * 10)); // Between 8 AM and 6 PM

      // Create delivery record
      deliveries.push({
        originId: warehouse.id,
        destinationId: premise.id,
        vehicleId: selectedVehicle.id,
        demand: deliveryDemand,
        distance: Math.round(distance * 100) / 100,
        duration: Math.round(costs.duration * 100) / 100,
        fuelCost: Math.round(costs.fuelCost * 100) / 100,
        laborCost: Math.round(costs.laborCost * 100) / 100,
        vehicleCost: Math.round(costs.vehicleCost * 100) / 100,
        carbonCost: Math.round(costs.carbonCost * 100) / 100,
        totalCost: Math.round(costs.totalCost * 100) / 100,
        co2Emissions: Math.round(costs.co2Emissions * 100) / 100,
        isAlpine,
        hasOvertime: costs.hasOvertime,
        deliveryDate: deliveryDateTime,
      });
    }
  }

  // Batch insert deliveries
  await prisma.delivery.createMany({
    data: deliveries,
  });

  return deliveries.length;
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
