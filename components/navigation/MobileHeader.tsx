"use client";

import React from "react";
import { AppHeader, AppHeaderProps } from "./AppHeader";

/**
 * MobileHeader is maintained as an alias to AppHeader for backwards compatibility.
 */
export function MobileHeader(props: Partial<AppHeaderProps>) {
  return <AppHeader onToggleSidebar={props.onToggleSidebar || (() => {})} />;
}
