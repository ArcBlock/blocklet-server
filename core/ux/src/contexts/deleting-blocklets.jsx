import { createContext, useState, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import xorWith from 'lodash/xorWith';

const DeletingBlockletContext = createContext({});

function DeletingBlockletProvider({ children, type = 'blocklets' }) {
  const [deletingBlocklets, setDeletingBlocklets] = useState([]);
  const deletingBlockletsDid = useRef([]); // use in onActionComplete

  /**
   * 添加删除中的 blocklet did
   * @param {String} did 删除中的did
   */
  const addDeletingDid = (did) => {
    if (!deletingBlockletsDid.current.includes(did)) {
      const reDeleteings = [...deletingBlockletsDid.current, did];
      setDeletingBlocklets(reDeleteings);
      deletingBlockletsDid.current = reDeleteings;
    }
  };

  /**
   * 去除删除中的 blocklet did
   * @param {String} did 删除中的did
   */
  const removeDeletingDid = (did) => {
    if (deletingBlockletsDid.current.includes(did)) {
      const reDeleteings = deletingBlockletsDid.current.filter((d) => {
        return d !== did;
      });
      setDeletingBlocklets(reDeleteings);
      deletingBlockletsDid.current = reDeleteings;
    }
  };

  /**
   * 将不在的 blocklet id 移出 deleting 数组
   * @param {Array} existDids 已存在的 blocklet did 数组集
   */
  const matchDeletingDid = (existDids) => {
    const inDeleting = deletingBlocklets.filter((did) => existDids.find((e) => e === did));
    const needMoveoutDeleting = xorWith(inDeleting, deletingBlocklets);
    needMoveoutDeleting.forEach((did) => removeDeletingDid(did));
  };

  return (
    <DeletingBlockletContext.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{
        type,
        deletingBlocklets,
        addDeletingDid,
        removeDeletingDid,
        matchDeletingDid,
      }}>
      {children}
    </DeletingBlockletContext.Provider>
  );
}

DeletingBlockletProvider.propTypes = {
  type: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function useDeletingBlockletContext() {
  return useContext(DeletingBlockletContext);
}

export { DeletingBlockletProvider, useDeletingBlockletContext };
