import React, { createContext, useContext, type PropsWithChildren } from 'react';

/**
 * @enum {number} User Level definitions with hierarchical values.
 */
const UserLevel = {

  /** Basic User Level. Lowest visibility */
  basic: 0,
  /** Power User Level. Full Visibility */
  power: 1,
  /** @deprecated Unused level, present as an example for future expansion */
  admin: 2
}

/** Possible UserLevels from the adapter */
type UserType = keyof typeof UserLevel;


interface UserAwareProps<P extends PropsWithChildren> extends PropsWithChildren{
  as?: React.FC<P>;
  userLevel?: UserType;
  rest?: P;
}

const UserLevelContext = createContext<UserType>("basic");

const UserAware = <P extends PropsWithChildren>(props: UserAwareProps<P> & P) => {

  const {as: Comp, children, userLevel = "basic", rest} = props;
  const level: UserType = useContext(UserLevelContext);

  // if the context defined userLevel is more than or equal to the level for this
  // user aware component
  const show = UserLevel[level] >= UserLevel[userLevel]

  if (!show) return null;
  if (Comp) return <Comp {...rest as P}>{children}</Comp>
  return children;
}


export {UserLevelContext, UserAware};