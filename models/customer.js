"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  ////////////////////////////////////// STATIC METHODS ////////////////////////////////////////////////
  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }
  /** Accepts a string and searches database for names that match
   *  Returns result as an array of customer instances
   */
  static async search(name) {
    // let [fname, lname] = name.split(' ');
    // lname = lname ? lname : fname; // helps reduce query repetition
    const results = await db.query(
      `SELECT id,
            first_name AS "firstName",
            last_name  AS "lastName",
            phone,
            notes
        FROM customers
        WHERE concat(first_name, ' ', last_name) ILIKE $1`,
      [`%${name}%`]
    );

    const customers = results.rows;
    if (customers === undefined) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 404;
      throw err;
    }

    return customers.map(c => new Customer(c));

  }

  /** Queries database for the ten customers with the most reservations
   *  Returns array of top ten customer instances 
   */
  static async topTen() {
    const results = await db.query(
      `SELECT customers.id,
          first_name AS "firstName",
          last_name  AS "lastName", 
          COUNT (reservations)
        FROM customers
            JOIN reservations ON customer_id = customers.id
        GROUP BY customers.id 
        ORDER BY COUNT(reservations) desc 
        LIMIT 10;`
    );


    const customers = results.rows;
    return customers.map(c => new Customer(c));
  }



  //////////////////////////////////// INSTANCE METHODS ////////////////////////////////////////////////
  /** get all reservations for this customer. */

  async getReservations() {

    return await Reservation.getReservationsForCustomer(this.id);
  }

  // async getReservationsCount() {
  //   const count = (await Reservation.getReservationsForCustomer(this.id)).length
  //   console.log(count)
  //   return count;
  // }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers(first_name, last_name, phone, notes)
             VALUES($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name = $1,
      last_name = $2,
      phone = $3,
      notes = $4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
  /** 
   * Combines customer's first and last name and 
   * Return as a single string for their full name
   */
  fullName() {
    return (this.firstName + ' ' + this.lastName);
  }



}

module.exports = Customer;
