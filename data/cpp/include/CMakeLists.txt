# Install headers from the include directory
file(GLOB HEXITECMHZ_INCLUDES *.h)
INSTALL(FILES ${HEXITECMHZ_INCLUDES} DESTINATION include/hexitecmhz)
