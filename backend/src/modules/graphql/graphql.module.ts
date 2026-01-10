import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../loan/entities/loan.entity';
import { LoanResolver } from './resolvers/loan.resolver';

// Note: GraphQL packages need to be installed:
// npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express graphql-subscriptions

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan]),
    // GraphQLModule.forRoot<ApolloDriverConfig>({
    //   driver: ApolloDriver,
    //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    //   sortSchema: true,
    //   playground: true,
    //   introspection: true,
    // }),
  ],
  providers: [LoanResolver],
  // exports: [GraphQLModule],
})
export class GraphQLApiModule {}

