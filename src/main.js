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
    
    const discountMultiplier = 1 - (discount / 100);
    return sale_price * quantity * discountMultiplier;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number} */

function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
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
 * Функция для округления чисел до 2 знаков после запятой
 * @param {number} num
 * @returns {number}
 */
function round2(num) {
  return Number(num.toFixed(2));
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options = {}) {
  if (!data || typeof data !== 'object') throw new Error('Некорректные данные');

  const { sellers, products, purchase_records } = data;

  if (!Array.isArray(sellers)) throw new Error('Нет продавцов');
  if (!Array.isArray(products)) throw new Error('Нет продуктов');
  if (!Array.isArray(purchase_records)) throw new Error('Нет записей покупок');
  if (sellers.length === 0) throw new Error('Нет продавцов');
  if (products.length === 0) throw new Error('Нет продуктов');
  if (purchase_records.length === 0) throw new Error('Нет записей покупок');

  const calculateRevenue = options.calculateRevenue || calculateSimpleRevenue;
  const calculateBonus = options.calculateBonus || calculateBonusByProfit;

  return sellers.map(seller => {
    // все продажи этого продавца
    const sales = purchase_records.filter(p => p.seller_id === seller.id);

    // расчет дохода
    const revenue = calculateRevenue(sales, products);
    // расчет прибыли
    const profit = sales.reduce((sum, sale) => {
      const product = products.find(p => p.sku === sale.sku);
      return sum + (product.price - product.cost) * sale.quantity;
    }, 0);
    // расчет бонуса
    const bonus = calculateBonus(profit);

    // топ-продукты по количеству продаж
    const top_products = sales
      .reduce((acc, sale) => {
        const existing = acc.find(p => p.sku === sale.sku);
        if (existing) {
          existing.quantity += sale.quantity;
        } else {
          acc.push({ sku: sale.sku, quantity: sale.quantity });
        }
        return acc;
      }, [])
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      seller_id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue,
      profit,
      bonus,
      sales_count: sales.length,
      top_products
    };
  });
}