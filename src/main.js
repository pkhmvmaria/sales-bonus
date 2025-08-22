/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const { sale_price, quantity, discount } = purchase;

  if (!discount || discount === 0) {
    return sale_price * quantity;
  }

  const discountMultiplier = 1 - discount / 100;
  return sale_price * quantity * discountMultiplier;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;

  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return profit * 0.05;
  }
}

function calculateRevenue(purchase, _product) {
  return calculateSimpleRevenue(purchase, _product);
}

function calculateBonus(index, total, seller) {
  return calculateBonusByProfit(index, total, seller);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // Валидация входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) || data.sellers.length === 0 ||
    !Array.isArray(data.products) || data.products.length === 0 ||
    !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
  ) {
    throw new Error('Некорректные входные данные');
  }

  // Проверка опций
  if (
    !options || typeof options !== 'object' ||
    typeof options.calculateRevenue !== 'function' ||
    typeof options.calculateBonus !== 'function'
  ) {
    throw new Error('Чего-то не хватает');
  }

  const { calculateRevenue, calculateBonus } = options;

  // Промежуточные данные по продавцам
  const sellerStats = data.sellers.map(s => ({
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}
  }));

  // Индексы
  const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.id, s]));
  const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

  // Основной проход по чекам
  data.purchase_records.forEach(record => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    // Счётчики по чеку
    seller.sales_count += 1;
    // Выручка — именно сумма чека из данных
    seller.revenue += record.total_amount;

    // Прибыль считаем по позициям
    record.items.forEach(item => {
      const product = productIndex[item.sku];
      if (!product) return;

      const revenue = calculateRevenue(item, product);               // с учётом скидки
      const cost = product.purchase_price * item.quantity;           // себестоимость
      seller.profit += (revenue - cost);

      // Учёт проданных товаров
      seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + item.quantity;
    });
  });

  // Сортировка по прибыли (убывание)
  sellerStats.sort((a, b) => b.profit - a.profit);

  // Бонусы и топ-10 товаров
  sellerStats.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // Возвращаем отчёт в нужном формате и с округлением
  return sellerStats.map(seller => ({
    seller_id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`.trim(),
    revenue: Number(seller.revenue.toFixed(2)),
    profit: Number(seller.profit.toFixed(2)),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: Number(seller.bonus.toFixed(2)),
  }));
}
