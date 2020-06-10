import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import ICreateOrderDTO from '../dtos/ICreateOrderDTO';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customer = await this.customersRepository.findById(customer_id);

    if (typeof customer === 'undefined') {
      throw new AppError('Customer not found');
    }

    const foundProducts = await this.productsRepository.findAllById(products);

    if (foundProducts.length < products.length) {
      throw new AppError('Products not found');
    }

    const dataOrder: ICreateOrderDTO = {
      customer,
      products: foundProducts.map((product, index) => {
        if (product.quantity < products[index].quantity) {
          throw new AppError('Out of stock');
        }

        return {
          product_id: product.id,
          price: product.price,
          quantity: products[index].quantity,
        };
      }),
    };

    const order = await this.ordersRepository.create(dataOrder);
    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
