// package: abt_node
// file: service.proto
import * as rpc_pb from './rpc_pb';
import * as type_pb from './type_pb';
export type TField = {
  required: boolean;
  params: string;
  dirs: string;
};
export interface TypeMap {
  DEFAULT: 0;
  MUTATION: 1;
  QUERY: 2;
}
