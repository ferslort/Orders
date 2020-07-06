const {gql} = require('apollo-server');

const typeDefs = gql`

  type Company {
    id: ID
    name: String
    lastname: String
    idcompany: String
    giro: String
    address: String
    avatar: String
    phone: String
    email: String
    active: Boolean
    delete: Boolean
  }

  type Token {
    token: String
  }

  type User {
    id: ID
    name: String
    lastname: String
    phone: String
    email: String
    avatar: String
    password: String
    active: Boolean
    delete: Boolean
    rol: String
    company: ID
  }

  type Product {
      id: ID
      name: String
      qly: Int
      avatar: String
      detail: String
      active: Boolean
      delete: Boolean
      company: ID
      status: String
      category: String
      unidad: String
  }

  type Dish{
      id:ID
      name: String
      price: Int
      avatar: String
      category: String
      company: ID
      detail: String
      active: Boolean
      delete: Boolean
      status: String
  }

  type Order{
      id:ID
      pedido: [PedidoOrder]
      total: Int
      user: User
      company: ID
      detail: DatosOrder
      typeOrder: String
      extra: String
      status: String
      registration: Float
      shortId: String
      delete: Boolean
      paid: Boolean
  }

  type DatosOrder {
    nameClient: String
    mesa: String
    observacion: String
    addres: String
    phone: String
  }

  type PedidoOrder{
    id: ID
    qly: Int
    name: String
    price: Float
  }

  type TopUserVentas{
      total: Float
      user: [User]
  }

  type TopVentasCompany{
      total: Float
      _id: ID
  }

  type VentasMes {
    total: Float
    _id: Int
  }

  type VentaDias{
    total: Float
    _id: String
  }

  type TipoOrder {
    _id: String
    count: Int
  }

  type StatusOrder{
    count: Int
  }

  type OrderDays {
    count: Int
  }

  type File {
    id: ID
    filename: String
    mimetype: String
    path: String
  }

  # //----------- Input -------------

  input CompanyInput {
    name: String
    lastname: String
    idcompany: String
    giro: String
    address: String
    avatar: String
    phone: String
    email: String
  
  }

  input AuthInput {
    email: String!
    password: String!
  }

  enum Roles {
    ADMIN
    MESERO
    COCINA
  }

  enum Unidades {
    Kg
    g
    Lt
    Unid
  }

  input UserInput {
    name: String
    lastname: String
    phone: String
    email: String
    password: String
    rol: Roles
    company: ID
  }

  input FileUpload{
    id: ID
    filename: String
    mimetype: String
    path: String
  }

  input ProductInput {
     name: String
      qly: Int
      avatar: String
      detail: String
      category: String
      unidad: String
      active: Boolean
  }

  input DishInput {
      name: String
      price: Float
      avatar: String
      category: String
      detail: String
      active: Boolean
      status: String
  }

  input OrderPedido{
    id: ID
    qly: Int
    name: String
    price: Float
  }

  input OrderInput {
    pedido: [OrderPedido]
    total: Float
    detail: DatosOrderInput
    typeOrder: String
    
  }

  input DatosOrderInput {
    nameClient: String
    mesa: String
    observacion: String
    addres: String
    phone: String
  }

  enum StatusPedido {
    PENDIENTE
    PREPARANDO
    LISTO
    PAGADO
  }

 

# ////////////////////////////////////////////////////
# ////Query
# ////////////////////////////////////////////////////

  type Query {
    # //----------- Usuarios -------------
        getUser(token: String) : User
        getUsers: [User]
        getUserID(id: ID): User
    # //----------- Productos -------------
        getProducts: [Product]
        getProductID(id: ID): Product
    # //----------- Platos -------------
        getDish: [Dish]
        getDishId(id: ID): Dish
    # //----------- Ordenes -------------
        getOrders: [Order]
        getOrderID(id: ID): Order
        getOrderUser: [Order]
        getOrderStatus: [Order]
        getOrderTotal: Int
        statusOrder(status: String): [StatusOrder]
        statusOrderDay: [OrderDays]
        getReadyOrder: [Order]
        getOrdersPaid: [Order]
        getOrderUserReady: [Order]
     # //----------- Avanzado -------------
        ventasUser: [TopUserVentas]
        ventasTotal: [TopVentasCompany]
        ventasMes: [VentasMes]
        ventasDias: [VentaDias]
        tipoOrder: [TipoOrder]
        
        
  }

# ////////////////////////////////////////////////////
# ////Mutation
# ////////////////////////////////////////////////////

  type Mutation {

    uploadFile(file: Upload): File

    # //----------- Empresa -------------
    #  crear empresa
    createCompany(input: CompanyInput): Company
    #  autenticar empresa
    authCompany(input: AuthInput): Token

    # //----------- Usuarios -------------
    #  crear usuarios
    createUser(input: UserInput, file: Upload): User
    #  autenticar usuarios
    authUser(input: AuthInput): Token
    #  Eliminar usuarios
    deteleUser(id: ID): User
    #  actualizar usuarios
    updateUser(id: ID, input: UserInput, file: Upload): User
    #  actualizar usuarios
    updateActiveUser(id: ID): User

    # //----------- Productos -------------
    createProduct(input: ProductInput): Product
    #  Eliminar producto
    deleteProduct(id: ID): Product
    #  actualizar stock producto
    updateProduct(id: ID, input: ProductInput): Product

    # //----------- Platos -------------
    createDish(input: DishInput, file: Upload): Dish
    #  Eliminar plato
    deleteDish(id: ID): Dish
    #  actualizar plato
    updateDish(id: ID, input: DishInput, file: Upload): Dish
      #  actualizar estado del plato
      updateStateDish(id: ID): Dish

    # //----------- Ordenes -------------
    createOrder(input: OrderInput): Order
    #  Eliminar orden
    deleteOrder(id: ID): Order
    #  actualizar orden
    updateOrder(id: ID, input: OrderInput): Order
      #  actualizar status order
    updateStatusOrder(id: ID, status: String): Order
      #  actualizar status order
    updatePaidOrder(id: ID): Order
  } 
`;

module.exports = typeDefs;